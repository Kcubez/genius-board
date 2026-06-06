import { renderHook, act } from '@testing-library/react';
import { useSheetSync } from './useSheetSync';
import { toast } from 'sonner';

// Mock the sonner toast library
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useSheetSync Hook', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
    
    // Default document.hidden mock (visible)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() =>
      useSheetSync('dataset-1', { enabled: false, interval: 60 })
    );

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncedAt).toBeNull();
    expect(result.current.lastSyncResult).toBeNull();
    expect(result.current.syncError).toBeNull();
  });

  it('should call fetch and sync successfully on manual trigger', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        changes: { added: 2, updated: 1, deleted: 0, columnsChanged: false },
        lastSyncedAt: '2026-06-06T12:00:00Z',
      }),
    });

    const onSyncComplete = jest.fn();
    const { result } = renderHook(() =>
      useSheetSync('dataset-1', { enabled: false, interval: 60, onSyncComplete })
    );

    // Call syncNow and await resolves
    await act(async () => {
      result.current.syncNow();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sheets/sync',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: 'dataset-1' }),
      })
    );
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncedAt).toBe('2026-06-06T12:00:00Z');
    expect(result.current.lastSyncResult).toEqual({
      added: 2,
      updated: 1,
      deleted: 0,
      columnsChanged: false,
      lastSyncedAt: '2026-06-06T12:00:00Z',
    });
    expect(toast.success).toHaveBeenCalledWith('Sheet synced', expect.objectContaining({
      description: '+2 added, ~1 updated',
    }));
    expect(onSyncComplete).toHaveBeenCalled();
  });

  it('should trigger sync periodically when enabled', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        changes: { added: 0, updated: 0, deleted: 0, columnsChanged: false },
        lastSyncedAt: '2026-06-06T12:00:00Z',
      }),
    });

    renderHook(() =>
      useSheetSync('dataset-1', { enabled: true, interval: 10 })
    );

    expect(mockFetch).not.toHaveBeenCalled();

    // Fast-forward 10 seconds
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should not sync when page is hidden (document.hidden = true)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock document.hidden as true
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });

    renderHook(() =>
      useSheetSync('dataset-1', { enabled: true, interval: 10 })
    );

    // Fast-forward 10 seconds
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
