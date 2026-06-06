import { extractSpreadsheetId, extractGid, computeSyncDiff } from './google-sheets';
import { ColumnInfo } from '@/types/csv';

describe('Google Sheets Utilities', () => {
  describe('extractSpreadsheetId', () => {
    it('should extract the ID from a standard Google Sheets URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUU5PGnE586615v6C0Oo/edit#gid=0';
      expect(extractSpreadsheetId(url)).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUU5PGnE586615v6C0Oo');
    });

    it('should extract the ID from a published Google Sheets URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3yXyZ_abcd12345/pubhtml';
      expect(extractSpreadsheetId(url)).toBe('2PACX-1vT3yXyZ_abcd12345');
    });

    it('should return the ID itself if it matches the pattern', () => {
      const rawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUU5PGnE586615v6C0Oo';
      expect(extractSpreadsheetId(rawId)).toBe(rawId);
    });

    it('should return null for invalid URLs or invalid IDs', () => {
      expect(extractSpreadsheetId('https://google.com')).toBeNull();
      expect(extractSpreadsheetId('')).toBeNull();
      expect(extractSpreadsheetId('too-short')).toBeNull();
    });
  });

  describe('extractGid', () => {
    it('should extract gid from URL hash parameter', () => {
      const url = 'https://docs.google.com/spreadsheets/d/abc/edit#gid=19283746';
      expect(extractGid(url)).toBe('19283746');
    });

    it('should return null if gid is not present', () => {
      const url = 'https://docs.google.com/spreadsheets/d/abc/edit';
      expect(extractGid(url)).toBeNull();
    });
  });

  describe('computeSyncDiff', () => {
    const existingCols: ColumnInfo[] = [
      { name: 'name', type: 'text', sampleValues: ['Alice'] },
      { name: 'age', type: 'number', sampleValues: [25] },
    ];

    it('should return zero changes when existing and new rows are identical', () => {
      const existingRows = [
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 25 } },
        { id: 'row-2', rowIndex: 1, data: { name: 'Bob', age: 30 } },
      ];
      const newRows = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, existingCols);

      expect(diff.added).toBe(0);
      expect(diff.updated).toBe(0);
      expect(diff.deleted).toBe(0);
      expect(diff.columnsChanged).toBe(false);
      expect(diff.rowsToAdd).toHaveLength(0);
      expect(diff.rowsToUpdate).toHaveLength(0);
      expect(diff.rowIdsToDelete).toHaveLength(0);
    });

    it('should ignore object key order differences during comparison', () => {
      const existingRows = [
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 25 } },
      ];
      // Keys are ordered differently in the new row
      const newRows = [
        { age: 25, name: 'Alice' },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, existingCols);

      expect(diff.updated).toBe(0);
      expect(diff.rowsToUpdate).toHaveLength(0);
    });

    it('should detect added rows at the end', () => {
      const existingRows = [
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 25 } },
      ];
      const newRows = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, existingCols);

      expect(diff.added).toBe(1);
      expect(diff.rowsToAdd).toEqual([
        { rowIndex: 1, data: { name: 'Bob', age: 30 } },
      ]);
      expect(diff.updated).toBe(0);
      expect(diff.deleted).toBe(0);
    });

    it('should detect updated rows based on positional change', () => {
      const existingRows = [
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 25 } },
        { id: 'row-2', rowIndex: 1, data: { name: 'Bob', age: 30 } },
      ];
      const newRows = [
        { name: 'Alice', age: 26 }, // updated
        { name: 'Bob', age: 30 },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, existingCols);

      expect(diff.updated).toBe(1);
      expect(diff.rowsToUpdate).toEqual([
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 26 } },
      ]);
      expect(diff.added).toBe(0);
      expect(diff.deleted).toBe(0);
    });

    it('should detect deleted rows from the end', () => {
      const existingRows = [
        { id: 'row-1', rowIndex: 0, data: { name: 'Alice', age: 25 } },
        { id: 'row-2', rowIndex: 1, data: { name: 'Bob', age: 30 } },
      ];
      const newRows = [
        { name: 'Alice', age: 25 },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, existingCols);

      expect(diff.deleted).toBe(1);
      expect(diff.rowIdsToDelete).toEqual(['row-2']);
      expect(diff.added).toBe(0);
      expect(diff.updated).toBe(0);
    });

    it('should detect column changes when names or types alter', () => {
      const existingRows = [{ id: 'row-1', rowIndex: 0, data: { name: 'Alice' } }];
      const newRows = [{ name: 'Alice' }];

      const newCols: ColumnInfo[] = [
        { name: 'name', type: 'text', sampleValues: ['Alice'] },
        { name: 'salary', type: 'number', sampleValues: [5000] },
      ];

      const diff = computeSyncDiff(existingRows, newRows, existingCols, newCols);

      expect(diff.columnsChanged).toBe(true);
    });
  });
});
