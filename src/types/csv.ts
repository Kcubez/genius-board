// CSV Column Types
export type ColumnType = 'text' | 'number' | 'date' | 'category';

// Column Metadata
export interface ColumnInfo {
  name: string;
  type: ColumnType;
  sampleValues: string[];
  uniqueValues?: string[]; // For category type
  min?: number; // For number type
  max?: number; // For number type
  dateFormat?: string; // For date type
}

// CSV Data Structure
export interface CsvData {
  columns: ColumnInfo[];
  rows: Record<string, string | number | Date | null>[];
  rawHeaders: string[];
  fileName: string;
  totalRows: number;
}

// CSV Parse Result
export interface CsvParseResult {
  success: boolean;
  data?: CsvData;
  error?: string;
  errorCode?: CsvErrorCode;
}

// Error Codes
export type CsvErrorCode =
  | 'CSV_INVALID'
  | 'CSV_EMPTY'
  | 'NO_HEADER'
  | 'PARSE_ERROR'
  | 'FILE_TOO_LARGE';

// CSV Upload State
export interface CsvUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  data: CsvData | null;
}
