'use client';

import { useState, useCallback } from 'react';
import { ColumnInfo } from '@/types/csv';

interface Dataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  createdAt: string;
  columns: ColumnInfo[];
}

interface DataRow {
  id: string;
  datasetId: string;
  rowIndex: number;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface DatasetWithRows extends Dataset {
  rows: DataRow[];
}

export function useDataset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all datasets
  const fetchDatasets = useCallback(async (): Promise<Dataset[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/datasets');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.datasets;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single dataset with all rows
  const fetchDataset = useCallback(async (id: string): Promise<DatasetWithRows | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/datasets/${id}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.dataset;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dataset');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save dataset to database
  const saveDataset = useCallback(
    async (
      name: string,
      fileName: string,
      columns: ColumnInfo[],
      rows: Record<string, unknown>[]
    ): Promise<Dataset | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, fileName, columns, rows }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.dataset;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save dataset');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete dataset
  const deleteDataset = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dataset');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new row
  const createRow = useCallback(
    async (datasetId: string, data: Record<string, unknown>): Promise<DataRow | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/rows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId, data }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.row;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create row');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update a row
  const updateRow = useCallback(
    async (rowId: string, data: Record<string, unknown>): Promise<DataRow | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/rows/${rowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.row;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update row');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete a row
  const deleteRow = useCallback(async (rowId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rows/${rowId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchDatasets,
    fetchDataset,
    saveDataset,
    deleteDataset,
    createRow,
    updateRow,
    deleteRow,
  };
}
