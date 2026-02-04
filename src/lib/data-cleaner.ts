/**
 * Data Cleaner Utility
 * Provides functions to analyze and clean dirty data in CSV datasets
 */

import { ColumnInfo } from '@/types/csv';
import {
  CleaningSummary,
  CleaningIssue,
  CleaningOptions,
  CleaningResult,
  CleaningChange,
  CleaningPreview,
  CaseNormalizationStrategy,
  MissingValueStrategy,
} from '@/types/data-cleaner';

type DataRow = Record<string, string | number | Date | null>;

/**
 * Common string representations of missing values
 * These are treated as missing/null values during cleaning
 */
const MISSING_VALUE_PLACEHOLDERS = new Set([
  'null',
  'n/a',
  'na',
  'nan',
  'none',
  '-',
  '.',
  'undefined',
  'missing',
  '#n/a',
  '#na',
  '(blank)',
  'blank',
  '(empty)',
  'empty',
]);

/**
 * Check if a value represents a missing/null value
 */
function isMissingValue(value: string | number | Date | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '' || MISSING_VALUE_PLACEHOLDERS.has(normalized);
  }
  return false;
}

/**
 * Analyze data for cleaning issues
 */
export function analyzeDataForCleaning(rows: DataRow[], columns: ColumnInfo[]): CleaningSummary {
  const issues: CleaningIssue[] = [];
  const duplicateRows: number[] = [];
  const missingValuesByColumn: Record<string, number[]> = {};
  const whitespaceIssues: Record<string, number[]> = {};
  const caseInconsistencies: Record<string, { value: string; count: number; rows: number[] }[]> =
    {};

  // 1. Check for duplicate rows
  const rowHashes = new Map<string, number[]>();
  rows.forEach((row, index) => {
    const hash = JSON.stringify(row);
    if (!rowHashes.has(hash)) {
      rowHashes.set(hash, []);
    }
    rowHashes.get(hash)!.push(index);
  });

  rowHashes.forEach(indices => {
    if (indices.length > 1) {
      // Skip the first occurrence, mark the rest as duplicates
      duplicateRows.push(...indices.slice(1));
    }
  });

  if (duplicateRows.length > 0) {
    issues.push({
      type: 'duplicate',
      rowIndices: duplicateRows,
      count: duplicateRows.length,
      description: `Found ${duplicateRows.length} duplicate rows`,
      severity: 'high',
    });
  }

  // 2. Check each column for issues
  columns.forEach(column => {
    const columnName = column.name;
    const missingRows: number[] = [];
    const whitespaceRows: number[] = [];
    const valueCounts = new Map<string, { count: number; rows: number[] }>();

    rows.forEach((row, index) => {
      const value = row[columnName];

      // Check for missing values (including placeholder strings like "null", "N/A", etc.)
      if (isMissingValue(value)) {
        missingRows.push(index);
      }

      // Check for whitespace issues (text columns only)
      if (typeof value === 'string') {
        if (value !== value.trim() || /\s{2,}/.test(value)) {
          whitespaceRows.push(index);
        }

        // Track value variations for case inconsistency (category/text columns)
        if (column.type === 'text' || column.type === 'category') {
          const normalized = value.toLowerCase().trim();
          if (normalized) {
            if (!valueCounts.has(normalized)) {
              valueCounts.set(normalized, { count: 0, rows: [] });
            }
            const entry = valueCounts.get(normalized)!;
            entry.count++;
            entry.rows.push(index);
          }
        }
      }
    });

    // Store missing values by column
    if (missingRows.length > 0) {
      missingValuesByColumn[columnName] = missingRows;
      issues.push({
        type: 'missing',
        column: columnName,
        rowIndices: missingRows,
        count: missingRows.length,
        description: `Column "${columnName}" has ${missingRows.length} missing values`,
        severity: missingRows.length > rows.length * 0.1 ? 'high' : 'medium',
      });
    }

    // Store whitespace issues
    if (whitespaceRows.length > 0) {
      whitespaceIssues[columnName] = whitespaceRows;
      issues.push({
        type: 'whitespace',
        column: columnName,
        rowIndices: whitespaceRows,
        count: whitespaceRows.length,
        description: `Column "${columnName}" has ${whitespaceRows.length} cells with whitespace issues`,
        severity: 'low',
      });
    }

    // Check for case inconsistencies (e.g., "USA", "usa", "Usa")
    if (column.type === 'text' || column.type === 'category') {
      const variations: { value: string; count: number; rows: number[] }[] = [];

      valueCounts.forEach((data, normalized) => {
        // Find all unique case variations
        const uniqueVariations = new Set<string>();
        data.rows.forEach(rowIndex => {
          const originalValue = String(rows[rowIndex][columnName] || '');
          if (originalValue.toLowerCase().trim() === normalized) {
            uniqueVariations.add(originalValue);
          }
        });

        if (uniqueVariations.size > 1) {
          uniqueVariations.forEach(variation => {
            const varRows = data.rows.filter(
              rowIndex => String(rows[rowIndex][columnName]) === variation
            );
            variations.push({
              value: variation,
              count: varRows.length,
              rows: varRows,
            });
          });
        }
      });

      if (variations.length > 0) {
        caseInconsistencies[columnName] = variations;
        issues.push({
          type: 'inconsistent_case',
          column: columnName,
          rowIndices: variations.flatMap(v => v.rows),
          count: variations.length,
          description: `Column "${columnName}" has ${variations.length} case inconsistencies`,
          severity: 'medium',
        });
      }
    }
  });

  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);

  return {
    totalRows: rows.length,
    totalIssues,
    issues,
    duplicateRows,
    missingValuesByColumn,
    whitespaceIssues,
    caseInconsistencies,
  };
}

/**
 * Generate a preview of what cleaning will do
 */
export function generateCleaningPreview(
  rows: DataRow[],
  columns: ColumnInfo[],
  options: CleaningOptions
): CleaningPreview {
  const summary = analyzeDataForCleaning(rows, columns);
  const affectedRows = new Set<number>();
  let estimatedRemovals = 0;
  let estimatedModifications = 0;

  // Calculate estimated removals
  if (options.removeDuplicates) {
    summary.duplicateRows.forEach(i => affectedRows.add(i));
    estimatedRemovals += summary.duplicateRows.length;
  }

  if (options.removeEmptyRows) {
    // Find rows where all values are empty
    rows.forEach((row, index) => {
      const allEmpty = columns.every(col => {
        const value = row[col.name];
        return isMissingValue(value);
      });
      if (allEmpty) {
        affectedRows.add(index);
        estimatedRemovals++;
      }
    });
  }

  if (options.handleMissingValues && options.missingValueStrategy === 'remove_row') {
    Object.values(summary.missingValuesByColumn).forEach(indices => {
      indices.forEach(i => {
        if (!affectedRows.has(i)) {
          affectedRows.add(i);
          estimatedRemovals++;
        }
      });
    });
  }

  // Calculate estimated modifications
  if (options.trimWhitespace) {
    Object.values(summary.whitespaceIssues).forEach(indices => {
      estimatedModifications += indices.length;
      indices.forEach(i => affectedRows.add(i));
    });
  }

  if (options.normalizeCase) {
    Object.values(summary.caseInconsistencies).forEach(variations => {
      variations.forEach(v => {
        estimatedModifications += v.count;
        v.rows.forEach(i => affectedRows.add(i));
      });
    });
  }

  if (options.handleMissingValues && options.missingValueStrategy !== 'remove_row') {
    Object.values(summary.missingValuesByColumn).forEach(indices => {
      estimatedModifications += indices.length;
      indices.forEach(i => affectedRows.add(i));
    });
  }

  return {
    summary,
    affectedRows: Array.from(affectedRows),
    estimatedRemovals,
    estimatedModifications,
  };
}

/**
 * Apply case normalization
 */
function normalizeCase(value: string, strategy: CaseNormalizationStrategy): string {
  switch (strategy) {
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'titlecase':
      return value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    default:
      return value;
  }
}

/**
 * Calculate fill value for missing values
 */
function calculateFillValue(
  rows: DataRow[],
  columnName: string,
  columnType: string,
  strategy: MissingValueStrategy,
  customValue?: string
): string | number | null {
  switch (strategy) {
    case 'fill_empty':
      return '';
    case 'fill_zero':
      return 0;
    case 'fill_custom':
      return customValue ?? '';
    case 'fill_average':
    case 'fill_median': {
      if (columnType !== 'number') return '';
      const numbers = rows
        .map(r => r[columnName])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (numbers.length === 0) return 0;
      if (strategy === 'fill_average') {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
      }
      // Median
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'fill_mode': {
      const values = rows
        .map(r => r[columnName])
        .filter(v => v !== null && v !== undefined && v !== '');
      if (values.length === 0) return '';
      const counts = new Map<string | number, number>();
      values.forEach(v => {
        const key = typeof v === 'object' ? String(v) : v;
        counts.set(key as string | number, (counts.get(key as string | number) || 0) + 1);
      });
      let maxCount = 0;
      let mode: string | number = '';
      counts.forEach((count, value) => {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      });
      return mode;
    }
    default:
      return null;
  }
}

/**
 * Clean the data based on provided options
 */
export function cleanData(
  rows: DataRow[],
  columns: ColumnInfo[],
  options: CleaningOptions
): { cleanedRows: DataRow[]; result: CleaningResult } {
  const changes: CleaningChange[] = [];
  let cleanedRows = [...rows.map(row => ({ ...row }))];
  const columnsToProcess =
    options.columnsToClean.length > 0
      ? columns.filter(c => options.columnsToClean.includes(c.name))
      : columns;

  const originalRowCount = cleanedRows.length;
  let modifiedCells = 0;

  // 1. Remove duplicate rows
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    const uniqueRows: DataRow[] = [];
    cleanedRows.forEach((row, index) => {
      const hash = JSON.stringify(row);
      if (!seen.has(hash)) {
        seen.add(hash);
        uniqueRows.push(row);
      } else {
        changes.push({
          type: 'removed_row',
          rowIndex: index,
          reason: 'Duplicate row removed',
        });
      }
    });
    cleanedRows = uniqueRows;
  }

  // 2. Remove completely empty rows
  if (options.removeEmptyRows) {
    cleanedRows = cleanedRows.filter((row, index) => {
      const allEmpty = columns.every(col => {
        const value = row[col.name];
        return isMissingValue(value);
      });
      if (allEmpty) {
        changes.push({
          type: 'removed_row',
          rowIndex: index,
          reason: 'Empty row removed',
        });
        return false;
      }
      return true;
    });
  }

  // 3. Handle missing values
  if (options.handleMissingValues) {
    if (options.missingValueStrategy === 'remove_row') {
      cleanedRows = cleanedRows.filter((row, index) => {
        const hasMissing = columnsToProcess.some(col => {
          const value = row[col.name];
          return isMissingValue(value);
        });
        if (hasMissing) {
          changes.push({
            type: 'removed_row',
            rowIndex: index,
            reason: 'Row with missing values removed',
          });
          return false;
        }
        return true;
      });
    } else {
      // Fill missing values
      columnsToProcess.forEach(col => {
        const fillValue = calculateFillValue(
          rows, // Use original rows for calculation
          col.name,
          col.type,
          options.missingValueStrategy,
          options.customFillValue
        );

        cleanedRows.forEach((row, index) => {
          const value = row[col.name];
          if (isMissingValue(value)) {
            const oldValue = value;
            row[col.name] = fillValue;
            modifiedCells++;
            changes.push({
              type: 'modified_cell',
              rowIndex: index,
              column: col.name,
              oldValue: oldValue as string | number | null,
              newValue: fillValue,
              reason: `Missing value filled with ${options.missingValueStrategy.replace(
                'fill_',
                ''
              )}`,
            });
          }
        });
      });
    }
  }

  // 4. Trim whitespace
  if (options.trimWhitespace) {
    cleanedRows.forEach((row, index) => {
      columnsToProcess.forEach(col => {
        const value = row[col.name];
        if (typeof value === 'string') {
          const trimmed = value.trim().replace(/\s+/g, ' ');
          if (trimmed !== value) {
            row[col.name] = trimmed;
            modifiedCells++;
            changes.push({
              type: 'modified_cell',
              rowIndex: index,
              column: col.name,
              oldValue: value,
              newValue: trimmed,
              reason: 'Whitespace trimmed',
            });
          }
        }
      });
    });
  }

  // 5. Normalize case
  if (options.normalizeCase) {
    cleanedRows.forEach((row, index) => {
      columnsToProcess
        .filter(c => c.type === 'text' || c.type === 'category')
        .forEach(col => {
          const value = row[col.name];
          if (typeof value === 'string' && value) {
            const normalized = normalizeCase(value, options.caseStrategy);
            if (normalized !== value) {
              row[col.name] = normalized;
              modifiedCells++;
              changes.push({
                type: 'modified_cell',
                rowIndex: index,
                column: col.name,
                oldValue: value,
                newValue: normalized,
                reason: `Case normalized to ${options.caseStrategy}`,
              });
            }
          }
        });
    });
  }

  const result: CleaningResult = {
    success: true,
    originalRowCount,
    cleanedRowCount: cleanedRows.length,
    removedRows: originalRowCount - cleanedRows.length,
    modifiedCells,
    changes,
  };

  return { cleanedRows, result };
}

/**
 * Get default cleaning options
 */
export function getDefaultCleaningOptions(): CleaningOptions {
  return {
    removeDuplicates: true,
    trimWhitespace: true,
    normalizeCase: false,
    caseStrategy: 'lowercase',
    handleMissingValues: false,
    missingValueStrategy: 'fill_empty',
    customFillValue: '',
    removeEmptyRows: true,
    columnsToClean: [],
  };
}
