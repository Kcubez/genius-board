'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  columnsChanged: boolean;
  lastSyncedAt: string;
}

interface UseSheetSyncOptions {
  enabled: boolean;
  interval: number; // in seconds
  onSyncComplete?: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSheetSync(
  datasetId: string,
  options: UseSheetSyncOptions
) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Refs for cleanup and visibility tracking
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);
  const isMountedRef = useRef(true);
  const isSyncingRef = useRef(false);

  // Keep callback reference updated without triggering dependency changes
  const onSyncCompleteRef = useRef(options.onSyncComplete);
  onSyncCompleteRef.current = options.onSyncComplete;

  // Perform a single sync
  const performSync = useCallback(async () => {
    // Prevent overlapping syncs
    if (isSyncingRef.current || !isMountedRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });

      const result = await response.json();

      if (!isMountedRef.current) return;

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      const syncResult: SyncResult = {
        added: result.changes?.added ?? 0,
        updated: result.changes?.updated ?? 0,
        deleted: result.changes?.deleted ?? 0,
        columnsChanged: result.changes?.columnsChanged ?? false,
        lastSyncedAt: result.lastSyncedAt ?? new Date().toISOString(),
      };

      setLastSyncResult(syncResult);
      setLastSyncedAt(syncResult.lastSyncedAt);

      // Only notify and refresh if there were actual data changes
      const hasChanges =
        syncResult.added > 0 ||
        syncResult.updated > 0 ||
        syncResult.deleted > 0 ||
        syncResult.columnsChanged;

      if (hasChanges) {
        const parts: string[] = [];
        if (syncResult.added > 0) parts.push(`+${syncResult.added} added`);
        if (syncResult.updated > 0) parts.push(`~${syncResult.updated} updated`);
        if (syncResult.deleted > 0) parts.push(`-${syncResult.deleted} deleted`);
        if (syncResult.columnsChanged) parts.push('columns changed');

        toast.success('Sheet synced', {
          description: parts.join(', '),
        });

        onSyncCompleteRef.current?.();
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncError(message);
      toast.error('Sync failed', { description: message });
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
      isSyncingRef.current = false;
    }
  }, [datasetId]);

  // Manual sync trigger
  const syncNow = useCallback(() => {
    performSync();
  }, [performSync]);

  // Page Visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-polling interval
  useEffect(() => {
    isMountedRef.current = true;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!options.enabled || !datasetId || options.interval <= 0) {
      return;
    }

    // Set up interval (only syncs when page is visible)
    const intervalMs = options.interval * 1000;
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && !isSyncingRef.current) {
        performSync();
      }
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [datasetId, options.enabled, options.interval, performSync]);

  return {
    isSyncing,
    lastSyncedAt,
    lastSyncResult,
    syncError,
    syncNow,
  };
}
