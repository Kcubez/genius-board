'use client';

import { useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SheetTab {
  title: string;
  sheetId: number;
  index: number;
  rowCount: number;
  columnCount: number;
}

export interface PreviewColumn {
  name: string;
  type: 'text' | 'number' | 'date' | 'category';
  sampleValues: string[];
}

export interface PreviewData {
  columns: PreviewColumn[];
  previewRows: Record<string, unknown>[];
  totalRows: number;
}

export interface ImportParams {
  url: string;
  tabName: string;
  tabGid?: number;
  datasetName: string;
  syncInterval?: number;
  syncEnabled?: boolean;
}

export interface ImportResult {
  id: string;
  name: string;
  rowCount: number;
  source: 'google_sheets';
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGoogleSheets() {
  // Tab fetching state
  const [tabs, setTabs] = useState<SheetTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [tabsError, setTabsError] = useState<string | null>(null);

  // Preview state
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Fetch all tabs from a Google Sheet
  const fetchTabs = useCallback(async (url: string) => {
    setTabsLoading(true);
    setTabsError(null);
    setTabs([]);
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`/api/sheets/tabs?url=${encodedUrl}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch sheet tabs');
      }

      setTabs(result.tabs);
      return { success: true, tabs: result.tabs as SheetTab[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sheet tabs';
      setTabsError(message);
      return { success: false, tabs: [] as SheetTab[], error: message };
    } finally {
      setTabsLoading(false);
    }
  }, []);

  // Fetch preview data for a specific tab
  const fetchPreview = useCallback(async (url: string, tab: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const encodedUrl = encodeURIComponent(url);
      const encodedTab = encodeURIComponent(tab);
      const response = await fetch(`/api/sheets/preview?url=${encodedUrl}&tab=${encodedTab}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch preview data');
      }

      const previewData: PreviewData = {
        columns: result.columns,
        previewRows: result.previewRows,
        totalRows: result.totalRows,
      };

      setPreview(previewData);
      return { success: true, preview: previewData };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch preview data';
      setPreviewError(message);
      return { success: false, preview: null, error: message };
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Import a Google Sheet as a dataset
  const importSheet = useCallback(async (params: ImportParams) => {
    setImporting(true);
    setImportError(null);
    try {
      const response = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: params.url,
          tabName: params.tabName,
          tabGid: params.tabGid,
          datasetName: params.datasetName,
          syncInterval: params.syncInterval,
          syncEnabled: params.syncEnabled ?? false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import sheet');
      }

      return { success: true, dataset: result.dataset as ImportResult };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import sheet';
      setImportError(message);
      return { success: false, dataset: null, error: message };
    } finally {
      setImporting(false);
    }
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setTabs([]);
    setTabsLoading(false);
    setTabsError(null);
    setPreview(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setImporting(false);
    setImportError(null);
  }, []);

  return {
    // Tab state
    tabs,
    tabsLoading,
    tabsError,
    fetchTabs,
    // Preview state
    preview,
    previewLoading,
    previewError,
    fetchPreview,
    // Import state
    importing,
    importError,
    importSheet,
    // Utilities
    reset,
  };
}
