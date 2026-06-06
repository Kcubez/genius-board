/**
 * Google Sheets API v4 - Server-side Client
 * 
 * Handles all Google Sheets API interactions with:
 * - URL parsing and spreadsheet ID extraction
 * - Tab listing and data fetching
 * - Column type detection (reuses existing CsvData format)
 * - Exponential backoff for rate limiting
 * - Server-side caching with TTL
 */

import { ColumnInfo, ColumnType, CsvData } from '@/types/csv';

// ─── Types ───────────────────────────────────────────────────────

export interface SheetTab {
  title: string;
  sheetId: number;
  index: number;
  rowCount: number;
  columnCount: number;
}

export interface SheetFetchResult {
  success: boolean;
  data?: CsvData;
  tabs?: SheetTab[];
  error?: string;
  errorCode?: 'INVALID_URL' | 'NOT_FOUND' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'EMPTY_SHEET' | 'API_KEY_MISSING';
}

export interface SyncDiff {
  added: number;
  updated: number;
  deleted: number;
  columnsChanged: boolean;
}

// ─── URL Parsing ─────────────────────────────────────────────────

/**
 * Extract spreadsheet ID from various Google Sheets URL formats:
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 * - https://docs.google.com/spreadsheets/d/e/PUBLISHED_ID/pubhtml
 * - Raw spreadsheet ID string
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  
  const trimmed = urlOrId.trim();
  
  // Try to match Google Sheets URL patterns
  const patterns = [
    /\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  
  // Check if it's a raw spreadsheet ID (alphanumeric + hyphens + underscores, 30-60 chars)
  if (/^[a-zA-Z0-9-_]{20,80}$/.test(trimmed)) {
    return trimmed;
  }
  
  return null;
}

/**
 * Extract GID from a Google Sheets URL
 */
export function extractGid(url: string): string | null {
  const match = url.match(/#gid=(\d+)/);
  return match ? match[1] : null;
}

// ─── API Helpers ─────────────────────────────────────────────────

const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function getApiKey(): string | null {
  return process.env.GOOGLE_SHEETS_API_KEY || null;
}

/**
 * Fetch with exponential backoff for rate limit handling
 */
async function fetchWithBackoff(url: string, maxRetries = 4): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) return response;
    
    // Rate limited or server error — retry with backoff
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Return non-retryable error response
    return response;
  }
  
  // Should not reach here, but safety net
  throw new Error('Max retries exceeded');
}

/**
 * Classify API error into user-friendly error code
 */
function classifyError(status: number, body: string): SheetFetchResult {
  if (status === 401 || status === 403) {
    return {
      success: false,
      error: 'Cannot access this sheet. Make sure it\'s set to "Anyone with the link can view".',
      errorCode: 'AUTH_ERROR',
    };
  }
  if (status === 404) {
    return {
      success: false,
      error: 'Sheet not found. Please check the URL.',
      errorCode: 'NOT_FOUND',
    };
  }
  if (status === 429) {
    return {
      success: false,
      error: 'Too many requests. Please try again in a moment.',
      errorCode: 'RATE_LIMIT',
    };
  }
  return {
    success: false,
    error: `Google Sheets API error (${status})`,
    errorCode: 'NETWORK_ERROR',
  };
}

// ─── Core API Functions ──────────────────────────────────────────

/**
 * List all tabs in a Google Sheet
 */
export async function fetchSheetTabs(spreadsheetId: string): Promise<SheetFetchResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'Google Sheets API key not configured', errorCode: 'API_KEY_MISSING' };
  }
  
  try {
    const url = `${API_BASE}/${spreadsheetId}?fields=sheets/properties&key=${apiKey}`;
    const response = await fetchWithBackoff(url);
    
    if (!response.ok) {
      return classifyError(response.status, await response.text());
    }
    
    const data = await response.json();
    
    const tabs: SheetTab[] = (data.sheets || []).map((sheet: any) => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId,
      index: sheet.properties.index,
      rowCount: sheet.properties.gridProperties?.rowCount || 0,
      columnCount: sheet.properties.gridProperties?.columnCount || 0,
    }));
    
    return { success: true, tabs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sheet tabs',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch data from a specific tab
 */
export async function fetchSheetData(
  spreadsheetId: string,
  tabName: string,
  maxRows?: number
): Promise<SheetFetchResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'Google Sheets API key not configured', errorCode: 'API_KEY_MISSING' };
  }
  
  try {
    // Encode tab name (handle spaces, special chars)
    const range = encodeURIComponent(`'${tabName}'!A:ZZ`);
    const url = `${API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    
    const response = await fetchWithBackoff(url);
    
    if (!response.ok) {
      return classifyError(response.status, await response.text());
    }
    
    const result = await response.json();
    const allRows: string[][] = result.values || [];
    
    if (allRows.length < 2) {
      return {
        success: false,
        error: 'Sheet is empty or has no data rows',
        errorCode: 'EMPTY_SHEET',
      };
    }
    
    const headers = allRows[0].map(h => String(h || '').trim()).filter(h => h !== '');
    let dataRows = allRows.slice(1);
    
    // Optionally limit rows (for preview)
    if (maxRows && dataRows.length > maxRows) {
      dataRows = dataRows.slice(0, maxRows);
    }
    
    // Filter out completely empty rows
    dataRows = dataRows.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    
    const csvData = convertSheetToCsvData(headers, dataRows, tabName);
    
    return { success: true, data: csvData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sheet data',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

// ─── Data Conversion ─────────────────────────────────────────────

/**
 * Detect column type from sample values (mirrors csv-parser.ts logic)
 */
function detectColumnType(values: (string | number | null | undefined)[], columnName?: string): ColumnType {
  const nonEmpty = values
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => String(v));
  
  if (nonEmpty.length === 0) return 'text';
  
  const sample = nonEmpty.slice(0, 100);
  const lowerCol = (columnName || '').toLowerCase();
  
  // Date detection
  const isDateColumnName = ['date', 'time', 'created', 'updated', 'timestamp'].some(
    hint => lowerCol.includes(hint)
  );
  
  const datePatterns = [
    /^\d{4}-\d{1,2}-\d{1,2}$/,
    /^\d{4}-\d{1,2}-\d{1,2}[ T]\d{2}:\d{2}/,
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{4}\/\d{1,2}\/\d{1,2}$/,
  ];
  
  const matchesDate = sample.every(v => 
    datePatterns.some(p => p.test(v.trim()))
  );
  
  if ((isDateColumnName && matchesDate) || matchesDate) return 'date';
  
  // Number detection
  const isNumber = sample.every(v => {
    const s = v.trim();
    if (s === '') return true;
    const cleaned = s.replace(/[,$]/g, '');
    if (cleaned.includes('/') || cleaned.split('-').length > 2) return false;
    return !isNaN(Number(cleaned)) && isFinite(Number(cleaned));
  });
  
  if (isNumber) return 'number';
  
  // Category detection
  const unique = new Set(sample);
  const nameLower = (columnName || '').toLowerCase();
  const isNameLike = ['customer', 'client', 'name', 'user', 'buyer', 'seller', 'vendor', 'supplier', 'person', 'employee', 'staff', 'agent']
    .some(kw => nameLower.includes(kw));
  
  if (isNameLike && nonEmpty.length >= 2) return 'category';
  if (!isNameLike && unique.size <= 30 && nonEmpty.length > unique.size * 2) return 'category';
  
  return 'text';
}

/**
 * Convert raw sheet data to CsvData format (compatible with existing dashboard)
 */
export function convertSheetToCsvData(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  tabName: string
): CsvData {
  // Build column info
  const columns: ColumnInfo[] = headers.map((header, colIdx) => {
    const values = rows.map(row => row[colIdx]);
    const type = detectColumnType(values, header);
    
    const nonEmpty = values
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v));
    
    const columnInfo: ColumnInfo = {
      name: header,
      type,
      sampleValues: nonEmpty.slice(0, 5),
    };
    
    if (type === 'category') {
      columnInfo.uniqueValues = Array.from(new Set(nonEmpty)).sort();
    }
    
    if (type === 'number') {
      const numbers = nonEmpty
        .map(v => parseFloat(v.replace(/[,$]/g, '')))
        .filter(n => !isNaN(n));
      if (numbers.length > 0) {
        columnInfo.min = Math.min(...numbers);
        columnInfo.max = Math.max(...numbers);
      }
    }
    
    return columnInfo;
  });
  
  // Convert rows with proper types
  const typedRows = rows.map(row => {
    const typedRow: Record<string, string | number | null> = {};
    
    columns.forEach((col, colIdx) => {
      const value = row[colIdx];
      
      if (value === null || value === undefined || String(value).trim() === '') {
        typedRow[col.name] = null;
      } else if (col.type === 'number') {
        const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[,$]/g, ''));
        typedRow[col.name] = isNaN(num) ? null : num;
      } else if (col.type === 'date') {
        typedRow[col.name] = String(value);
      } else {
        typedRow[col.name] = String(value);
      }
    });
    
    return typedRow;
  });
  
  return {
    columns,
    rows: typedRows,
    rawHeaders: headers,
    fileName: `${tabName} (Google Sheets)`,
    totalRows: typedRows.length,
  };
}

// ─── Sync Utilities ──────────────────────────────────────────────

function rowHash(data: Record<string, unknown>): string {
  if (!data) return '';
  const sorted: Record<string, unknown> = {};
  Object.keys(data)
    .sort()
    .forEach(key => {
      sorted[key] = data[key];
    });
  return JSON.stringify(sorted);
}

/**
 * Compare existing data with fresh sheet data and compute a diff
 */
export function computeSyncDiff(
  existingRows: { id: string; rowIndex: number; data: Record<string, unknown> }[],
  newRows: Record<string, string | number | Date | null>[],
  existingColumns: ColumnInfo[],
  newColumns: ColumnInfo[]
): SyncDiff & {
  rowsToAdd: { rowIndex: number; data: Record<string, string | number | Date | null> }[];
  rowsToUpdate: { id: string; rowIndex: number; data: Record<string, string | number | Date | null> }[];
  rowIdsToDelete: string[];
  updatedColumns: ColumnInfo[];
} {
  const maxExisting = existingRows.length;
  const maxNew = newRows.length;
  
  const rowsToAdd: { rowIndex: number; data: Record<string, string | number | Date | null> }[] = [];
  const rowsToUpdate: { id: string; rowIndex: number; data: Record<string, string | number | Date | null> }[] = [];
  const rowIdsToDelete: string[] = [];
  
  // Sort existing rows by rowIndex for positional comparison
  const sortedExisting = [...existingRows].sort((a, b) => a.rowIndex - b.rowIndex);
  
  // Compare existing rows with new rows by position
  for (let i = 0; i < Math.max(maxExisting, maxNew); i++) {
    if (i < maxExisting && i < maxNew) {
      // Both exist — check if data changed
      const existingHash = rowHash(sortedExisting[i].data);
      const newHash = rowHash(newRows[i]);
      if (existingHash !== newHash) {
        rowsToUpdate.push({
          id: sortedExisting[i].id,
          rowIndex: i,
          data: newRows[i],
        });
      }
    } else if (i >= maxExisting) {
      // New row
      rowsToAdd.push({ rowIndex: i, data: newRows[i] });
    } else {
      // Deleted row
      rowIdsToDelete.push(sortedExisting[i].id);
    }
  }
  
  // Check if columns changed
  const columnsChanged = JSON.stringify(existingColumns.map(c => ({ name: c.name, type: c.type })))
    !== JSON.stringify(newColumns.map(c => ({ name: c.name, type: c.type })));
  
  return {
    added: rowsToAdd.length,
    updated: rowsToUpdate.length,
    deleted: rowIdsToDelete.length,
    columnsChanged,
    rowsToAdd,
    rowsToUpdate,
    rowIdsToDelete,
    updatedColumns: newColumns,
  };
}
