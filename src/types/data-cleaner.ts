// Data Cleaning Types

export type CleaningIssueType =
  | 'duplicate'
  | 'missing'
  | 'whitespace'
  | 'inconsistent_case'
  | 'invalid_number'
  | 'invalid_date'
  | 'outlier';

export interface CleaningIssue {
  type: CleaningIssueType;
  column?: string;
  rowIndices: number[];
  count: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CleaningSummary {
  totalRows: number;
  totalIssues: number;
  issues: CleaningIssue[];
  duplicateRows: number[];
  missingValuesByColumn: Record<string, number[]>;
  whitespaceIssues: Record<string, number[]>;
  caseInconsistencies: Record<string, { value: string; count: number; rows: number[] }[]>;
}

export type MissingValueStrategy =
  | 'remove_row'
  | 'fill_empty'
  | 'fill_zero'
  | 'fill_average'
  | 'fill_median'
  | 'fill_mode'
  | 'fill_custom';

export type CaseNormalizationStrategy = 'lowercase' | 'uppercase' | 'titlecase' | 'none';

export interface CleaningOptions {
  removeDuplicates: boolean;
  trimWhitespace: boolean;
  normalizeCase: boolean;
  caseStrategy: CaseNormalizationStrategy;
  handleMissingValues: boolean;
  missingValueStrategy: MissingValueStrategy;
  customFillValue?: string;
  removeEmptyRows: boolean;
  columnsToClean: string[]; // Empty means all columns
}

export interface CleaningResult {
  success: boolean;
  originalRowCount: number;
  cleanedRowCount: number;
  removedRows: number;
  modifiedCells: number;
  changes: CleaningChange[];
}

export interface CleaningChange {
  type: 'removed_row' | 'modified_cell';
  rowIndex?: number;
  column?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  reason: string;
}

// Preview state for showing what will be cleaned
export interface CleaningPreview {
  summary: CleaningSummary;
  affectedRows: number[];
  estimatedRemovals: number;
  estimatedModifications: number;
}
