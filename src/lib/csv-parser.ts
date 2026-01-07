import Papa from 'papaparse';
import { CsvData, ColumnInfo, ColumnType, CsvParseResult, CsvErrorCode } from '@/types/csv';

// Detect column type from sample values
function detectColumnType(values: (string | null | undefined)[]): ColumnType {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonEmptyValues.length === 0) return 'text';

  // Sample up to 100 values for detection
  const sampleValues = nonEmptyValues.slice(0, 100);

  // Check if all values are dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];

  const isDate = sampleValues.every(v => {
    if (datePatterns.some(pattern => pattern.test(v as string))) return true;
    const date = new Date(v as string);
    return !isNaN(date.getTime()) && v!.toString().length > 6;
  });

  if (isDate) return 'date';

  // Check if all values are numbers
  const isNumber = sampleValues.every(v => {
    const cleaned = String(v).replace(/[,$]/g, '');
    return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned));
  });

  if (isNumber) return 'number';

  // Check if it's a category (limited unique values)
  const uniqueValues = new Set(sampleValues);
  if (uniqueValues.size <= 20 && nonEmptyValues.length > uniqueValues.size * 2) {
    return 'category';
  }

  return 'text';
}

// Get unique values for category columns
function getUniqueValues(values: (string | null | undefined)[]): string[] {
  const unique = new Set(
    values.filter(v => v !== null && v !== undefined && v !== '').map(v => String(v))
  );
  return Array.from(unique).sort();
}

// Get min/max for number columns
function getNumberRange(values: (string | null | undefined)[]): { min: number; max: number } {
  const numbers = values
    .filter(v => v !== null && v !== undefined && v !== '')
    .map(v => parseFloat(String(v).replace(/[,$]/g, '')))
    .filter(n => !isNaN(n));

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
}

// Parse CSV file and return structured data
export function parseCsv(file: File): Promise<CsvParseResult> {
  return new Promise(resolve => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      resolve({
        success: false,
        error: 'File size exceeds 10MB limit',
        errorCode: 'FILE_TOO_LARGE',
      });
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: results => {
        // Check for parse errors
        if (results.errors.length > 0 && results.data.length === 0) {
          resolve({
            success: false,
            error: results.errors[0].message,
            errorCode: 'PARSE_ERROR',
          });
          return;
        }

        // Check for empty data
        if (results.data.length === 0) {
          resolve({
            success: false,
            error: 'CSV file is empty or has no valid data rows',
            errorCode: 'CSV_EMPTY',
          });
          return;
        }

        // Check for headers
        const headers = results.meta.fields;
        if (!headers || headers.length === 0) {
          resolve({
            success: false,
            error: 'CSV file must have a header row',
            errorCode: 'NO_HEADER',
          });
          return;
        }

        // Build column info
        const columns: ColumnInfo[] = headers.map(header => {
          const values = results.data.map(row => row[header]);
          const type = detectColumnType(values);

          const columnInfo: ColumnInfo = {
            name: header,
            type,
            sampleValues: values.slice(0, 5).filter(v => v !== null && v !== undefined) as string[],
          };

          if (type === 'category') {
            columnInfo.uniqueValues = getUniqueValues(values);
          }

          if (type === 'number') {
            const range = getNumberRange(values);
            columnInfo.min = range.min;
            columnInfo.max = range.max;
          }

          return columnInfo;
        });

        // Convert rows with proper types
        const rows = results.data.map(row => {
          const typedRow: Record<string, string | number | Date | null> = {};

          columns.forEach(col => {
            const value = row[col.name];

            if (value === null || value === undefined || value === '') {
              typedRow[col.name] = null;
            } else if (col.type === 'number') {
              typedRow[col.name] = parseFloat(String(value).replace(/[,$]/g, ''));
            } else if (col.type === 'date') {
              typedRow[col.name] = new Date(value);
            } else {
              typedRow[col.name] = value;
            }
          });

          return typedRow;
        });

        const csvData: CsvData = {
          columns,
          rows,
          rawHeaders: headers,
          fileName: file.name,
          totalRows: rows.length,
        };

        resolve({
          success: true,
          data: csvData,
        });
      },
      error: error => {
        resolve({
          success: false,
          error: error.message,
          errorCode: 'PARSE_ERROR',
        });
      },
    });
  });
}

// Convert filtered data back to CSV for export
export function convertToCsv(
  data: Record<string, string | number | Date | null>[],
  columns: ColumnInfo[]
): string {
  if (data.length === 0) return '';

  const headers = columns.map(col => col.name);

  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString().split('T')[0];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

// Download CSV file
export function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
