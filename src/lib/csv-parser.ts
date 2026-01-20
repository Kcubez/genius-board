import Papa from 'papaparse';
import { CsvData, ColumnInfo, ColumnType, CsvParseResult, CsvErrorCode } from '@/types/csv';

// Detect column type from sample values
function detectColumnType(values: (string | null | undefined)[], columnName?: string): ColumnType {
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

  // Check if column name suggests it should be treated as category (name/customer-like columns)
  const nameLowercase = (columnName || '').toLowerCase();
  const isNameLikeColumn = [
    'customer',
    'client',
    'name',
    'user',
    'buyer',
    'seller',
    'vendor',
    'supplier',
    'person',
    'employee',
    'staff',
    'agent',
  ].some(keyword => nameLowercase.includes(keyword));

  // For name-like columns, no limit (always category)
  // For other columns, allow up to 30 unique values
  const categoryThreshold = 30;

  // Name-like columns: ALWAYS treated as category (no limit on unique values)
  // Other columns: need repetition (2x rule) and limited unique values to be considered category
  if (isNameLikeColumn && nonEmptyValues.length >= 2) {
    return 'category';
  } else if (
    !isNameLikeColumn &&
    uniqueValues.size <= categoryThreshold &&
    nonEmptyValues.length > uniqueValues.size * 2
  ) {
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

// Parse Excel file and return structured data
function parseExcel(file: File): Promise<CsvParseResult> {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = async e => {
      try {
        // Dynamic import to avoid SSR issues
        const XLSX = await import('xlsx');

        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            error: 'Excel file has no sheets',
            errorCode: 'CSV_EMPTY',
          });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as unknown as unknown[][];

        if (jsonData.length < 2) {
          resolve({
            success: false,
            error: 'Excel file must have a header row and at least one data row',
            errorCode: 'CSV_EMPTY',
          });
          return;
        }

        // First row is headers
        const headers = (jsonData[0] as unknown[])
          .map(h => String(h || '').trim())
          .filter(h => h !== '');
        const rows = jsonData
          .slice(1)
          .map(row => {
            const rowData: Record<string, string> = {};
            headers.forEach((header, i) => {
              const value = (row as unknown[])[i];
              if (value instanceof Date) {
                rowData[header] = value.toISOString().split('T')[0];
              } else {
                rowData[header] = value !== null && value !== undefined ? String(value) : '';
              }
            });
            return rowData;
          })
          .filter(row => Object.values(row).some(v => v !== ''));

        // Build column info using the same logic as CSV
        const columns: ColumnInfo[] = headers.map(header => {
          const values = rows.map(row => row[header]);
          const type = detectColumnType(values, header);

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
        const typedRows = rows.map(row => {
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
          rows: typedRows,
          rawHeaders: headers,
          fileName: file.name,
          totalRows: typedRows.length,
        };

        resolve({
          success: true,
          data: csvData,
        });
      } catch (error) {
        resolve({
          success: false,
          error: 'Failed to parse Excel file',
          errorCode: 'PARSE_ERROR',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
        errorCode: 'PARSE_ERROR',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse CSV file and return structured data
function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise(resolve => {
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
          const type = detectColumnType(values, header);

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

// Main parser function - handles both CSV and Excel
export function parseCsv(file: File): Promise<CsvParseResult> {
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return Promise.resolve({
      success: false,
      error: 'File size exceeds 10MB limit',
      errorCode: 'FILE_TOO_LARGE',
    });
  }

  const fileName = file.name.toLowerCase();

  // Check file extension and parse accordingly
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  } else if (fileName.endsWith('.csv')) {
    return parseCsvFile(file);
  } else {
    return Promise.resolve({
      success: false,
      error: 'Unsupported file format. Please upload a CSV or Excel file.',
      errorCode: 'CSV_INVALID',
    });
  }
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
