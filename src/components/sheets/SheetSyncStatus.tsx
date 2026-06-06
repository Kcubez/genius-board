'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Cloud, CloudOff, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSheetSync } from '@/hooks/useSheetSync';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SheetSyncStatusProps {
  datasetId: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSyncedAt: string | null;
  onSyncComplete: () => void;
}

export function SheetSyncStatus({
  datasetId,
  syncEnabled,
  syncInterval,
  lastSyncedAt: initialLastSyncedAt,
  onSyncComplete,
}: SheetSyncStatusProps) {
  const { t, language } = useLanguage();
  
  const [localEnabled, setLocalEnabled] = useState(syncEnabled);
  const [localInterval, setLocalInterval] = useState(syncInterval);
  const [updating, setUpdating] = useState(false);
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    setLocalEnabled(syncEnabled);
  }, [syncEnabled]);

  useEffect(() => {
    setLocalInterval(syncInterval);
  }, [syncInterval]);

  const { isSyncing, lastSyncedAt, lastSyncResult, syncError, syncNow } = useSheetSync(
    datasetId,
    {
      enabled: localEnabled,
      interval: localInterval,
      onSyncComplete,
    }
  );

  const currentSyncTime = lastSyncedAt || initialLastSyncedAt;

  // Relative time generator
  useEffect(() => {
    function updateRelativeTime() {
      if (!currentSyncTime) {
        setRelativeTime(t('sheets.neverSynced'));
        return;
      }
      
      const date = new Date(currentSyncTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      
      if (diffSecs < 10) {
        setRelativeTime(language === 'mm' ? 'ခုနလေးတင်' : 'just now');
      } else if (diffSecs < 60) {
        setRelativeTime(`${diffSecs}s ${language === 'mm' ? 'အလို' : 'ago'}`);
      } else {
        const diffMins = Math.floor(diffSecs / 60);
        if (diffMins < 60) {
          setRelativeTime(`${diffMins}m ${language === 'mm' ? 'အလို' : 'ago'}`);
        } else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) {
            setRelativeTime(`${diffHours}h ${language === 'mm' ? 'အလို' : 'ago'}`);
          } else {
            setRelativeTime(date.toLocaleDateString());
          }
        }
      }
    }

    updateRelativeTime();
    const timer = setInterval(updateRelativeTime, 5000);
    return () => clearInterval(timer);
  }, [currentSyncTime, language, t]);

  const handleToggleAutoSync = async () => {
    const nextEnabled = !localEnabled;
    setLocalEnabled(nextEnabled);
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled: nextEnabled }),
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update sync settings');
      }
      
      toast.success(nextEnabled ? t('sheets.syncEnabled') : t('sheets.syncDisabled'));
      onSyncComplete();
    } catch (err) {
      setLocalEnabled(!nextEnabled);
      const message = err instanceof Error ? err.message : 'Update failed';
      toast.error('Failed to update sync settings', { description: message });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeInterval = async (val: string) => {
    const nextInterval = Number(val);
    setLocalInterval(nextInterval);
    setUpdating(true);
    
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncInterval: nextInterval }),
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update sync interval');
      }
      
      toast.success('Sync interval updated');
      onSyncComplete();
    } catch (err) {
      setLocalInterval(localInterval);
      const message = err instanceof Error ? err.message : 'Update failed';
      toast.error('Failed to update sync interval', { description: message });
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = React.useMemo(() => {
    if (syncError) {
      return { color: 'bg-red-500', pulse: false, label: t('sheets.syncError') };
    }
    if (!currentSyncTime) {
      return { color: 'bg-neutral-400', pulse: false, label: t('sheets.neverSynced') };
    }
    const diffMs = new Date().getTime() - new Date(currentSyncTime).getTime();
    const diffMins = diffMs / (1000 * 60);
    if (diffMins < 1) {
      return { color: 'bg-green-500', pulse: true, label: t('sheets.syncUpToDate') };
    } else if (diffMins < 5) {
      return { color: 'bg-amber-500', pulse: false, label: t('sheets.syncUpToDate') };
    } else {
      return { color: 'bg-neutral-400', pulse: false, label: t('sheets.syncUpToDate') };
    }
  }, [currentSyncTime, syncError, t]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-2.5 gap-1.5 border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 rounded-lg text-xs font-semibold shadow-xs select-none transition-all duration-200 cursor-pointer",
            syncError && "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/30 dark:text-red-400",
            isSyncing && "border-violet-200 text-violet-600 dark:border-violet-950/30"
          )}
        >
          {isSyncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-violet-600 dark:text-violet-400" />
          ) : localEnabled ? (
            <Cloud className={cn("h-3.5 w-3.5", syncError ? "text-red-500" : "text-neutral-400 dark:text-neutral-500")} />
          ) : (
            <CloudOff className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
          )}
          
          <span className="max-w-[120px] truncate hidden sm:inline">
            {isSyncing ? t('sheets.syncing') : relativeTime}
          </span>
          
          <div className="relative flex h-1.5 w-1.5 shrink-0">
            {statusInfo.pulse && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", statusInfo.color)}></span>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-4 rounded-xl shadow-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
        {/* Popover Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-900">
          <div className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              {t('sheets.syncStatus')}
            </span>
          </div>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase leading-none",
            syncError && "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
            !syncError && localEnabled && "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
            !syncError && !localEnabled && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          )}>
            {isSyncing ? 'Syncing' : syncError ? 'Error' : localEnabled ? 'Active' : 'Paused'}
          </span>
        </div>

        {/* Sync Info Body */}
        <div className="space-y-2.5 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              {t('sheets.lastSynced')}: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{relativeTime}</span>
            </span>
          </div>

          {/* Sync status changes message */}
          {lastSyncResult && (lastSyncResult.added > 0 || lastSyncResult.updated > 0 || lastSyncResult.deleted > 0) && (
            <div className="flex items-center gap-1.5 p-2 bg-green-50/50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
              <div className="leading-tight">
                <span className="font-semibold text-[10px] uppercase block mb-0.5">Last Changes Synced</span>
                <span>
                  {[
                    lastSyncResult.added > 0 ? `+${lastSyncResult.added} added` : '',
                    lastSyncResult.updated > 0 ? `~${lastSyncResult.updated} updated` : '',
                    lastSyncResult.deleted > 0 ? `-${lastSyncResult.deleted} deleted` : '',
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {syncError && (
            <div className="flex items-center gap-1.5 p-2 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="leading-tight">
                <span className="font-semibold text-[10px] uppercase block mb-0.5">Sync Error</span>
                <span className="truncate max-w-[190px] block">{syncError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-900">
          
          {/* Auto Sync Toggle switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="popover-auto-sync" className="text-xs cursor-pointer select-none text-neutral-700 dark:text-neutral-300">
              {t('sheets.autoSync')}
            </Label>
            <button
              id="popover-auto-sync"
              type="button"
              role="switch"
              aria-checked={localEnabled}
              disabled={updating || isSyncing}
              onClick={handleToggleAutoSync}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50",
                localEnabled ? "bg-violet-600" : "bg-neutral-200 dark:bg-neutral-800"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  localEnabled ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Sync Interval Selector */}
          {localEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-700 dark:text-neutral-300">Interval</span>
              <Select 
                value={String(localInterval)} 
                onValueChange={handleChangeInterval}
                disabled={updating || isSyncing}
              >
                <SelectTrigger className="border-neutral-200 dark:border-neutral-800 h-7 text-xs w-[80px] bg-transparent">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10s</SelectItem>
                  <SelectItem value="30" className="text-xs">30s</SelectItem>
                  <SelectItem value="60" className="text-xs">1m</SelectItem>
                  <SelectItem value="120" className="text-xs">2m</SelectItem>
                  <SelectItem value="300" className="text-xs">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

        </div>

        {/* Manual Sync Button */}
        <Button
          size="sm"
          onClick={syncNow}
          disabled={isSyncing || updating}
          className="w-full h-8 gap-1.5 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold text-xs shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? t('sheets.syncing') : t('sheets.syncNow')}
        </Button>

      </PopoverContent>
    </Popover>
  );
}
