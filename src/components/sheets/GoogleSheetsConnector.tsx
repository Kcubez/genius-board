'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  FileSpreadsheet, 
  HelpCircle, 
  Loader2, 
  AlertCircle,
  Database
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { extractSpreadsheetId } from '@/lib/google-sheets';

interface GoogleSheetsConnectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleSheetsConnector({ open, onOpenChange }: GoogleSheetsConnectorProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    tabs,
    tabsLoading,
    tabsError,
    fetchTabs,
    preview,
    previewLoading,
    previewError,
    fetchPreview,
    importing,
    importError,
    importSheet,
    reset
  } = useGoogleSheets();

  // Wizard state
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [datasetName, setDatasetName] = useState('');
  const [syncInterval, setSyncInterval] = useState<number>(60); // Default 60 seconds (1 minute)
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset states on modal close/open
  useEffect(() => {
    if (!open) {
      reset();
      setStep(1);
      setUrl('');
      setSelectedTab('');
      setDatasetName('');
      setSyncInterval(60);
      setSyncEnabled(true);
      setErrorMsg(null);
    }
  }, [open, reset]);

  // URL Real-time Validation
  const isValidUrl = useMemo(() => {
    return !!extractSpreadsheetId(url);
  }, [url]);

  // Handle URL Connection (Step 1 -> 2)
  const handleConnect = async () => {
    if (!isValidUrl) {
      setErrorMsg(t('sheets.invalidUrl'));
      return;
    }
    setErrorMsg(null);

    const result = await fetchTabs(url);
    if (result.success && result.tabs && result.tabs.length > 0) {
      setStep(2);
      // Auto-select first tab
      setSelectedTab(result.tabs[0].title);
    } else {
      setErrorMsg(result.error || t('sheets.connectError'));
    }
  };

  // Handle Tab Selection (Step 2 -> 3)
  const handleTabSelect = async (tabName: string) => {
    setSelectedTab(tabName);
    setDatasetName(tabName);
    setErrorMsg(null);

    const result = await fetchPreview(url, tabName);
    if (result.success && result.preview) {
      setStep(3);
    } else {
      setErrorMsg(result.error || t('sheets.fetchError'));
    }
  };

  // Handle Import (Step 3 -> 4)
  const handleImport = async () => {
    if (!datasetName.trim()) {
      setErrorMsg(t('sheets.datasetNamePlaceholder'));
      return;
    }
    setErrorMsg(null);

    const targetTab = tabs.find(t => t.title === selectedTab);

    const result = await importSheet({
      url,
      tabName: selectedTab,
      tabGid: targetTab?.sheetId,
      datasetName,
      syncInterval,
      syncEnabled
    });

    if (result.success && result.dataset && result.dataset.id) {
      onOpenChange(false);
      router.push(`/dashboard/${result.dataset.id}`);
    } else {
      setErrorMsg(result.error || t('sheets.fetchError'));
    }
  };

  // Google Sheets SVG Logo
  const GoogleSheetsLogo = () => (
    <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm0-4H7v-2h5v2zm0-4H7V7h5v2zm5 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2z"/>
    </svg>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl">
        
        {/* Header with Step Tracker */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <GoogleSheetsLogo />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {t('sheets.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-neutral-500">
                {step === 1 && t('sheets.enterUrl')}
                {step === 2 && t('sheets.chooseTab')}
                {step === 3 && t('sheets.preview')}
              </DialogDescription>
            </div>
          </div>

          {/* Premium Progress Bar */}
          <div className="flex items-center justify-between w-full mt-4 px-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                      step === s && "bg-violet-600 text-white shadow-sm ring-4 ring-violet-500/20 scale-110",
                      step > s && "bg-green-600 text-white",
                      step < s && "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600"
                    )}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span 
                    className={cn(
                      "text-xs font-medium hidden sm:inline-block",
                      step === s && "text-violet-600 dark:text-violet-400 font-semibold",
                      step !== s && "text-neutral-500"
                    )}
                  >
                    {s === 1 && t('sheets.enterUrl')}
                    {s === 2 && t('sheets.chooseTab')}
                    {s === 3 && t('sheets.reviewImport')}
                  </span>
                </div>
                {s < 3 && (
                  <div 
                    className={cn(
                      "flex-1 h-0.5 mx-4 transition-all duration-500",
                      step > s ? "bg-green-600" : "bg-neutral-100 dark:bg-neutral-900"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: URL Input */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-url" className="text-sm font-semibold">
                  {t('sheets.title')}
                </Label>
                <div className="relative">
                  <Input
                    id="sheet-url"
                    type="text"
                    placeholder={t('sheets.urlPlaceholder')}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setErrorMsg(null);
                    }}
                    className={cn(
                      "pr-10 h-11 transition-all duration-200 border-neutral-200 dark:border-neutral-800 focus:ring-violet-500",
                      isValidUrl && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                    )}
                    disabled={tabsLoading}
                  />
                  {isValidUrl && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 animate-in fade-in zoom-in-50 duration-200" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {t('sheets.urlHelp')}
                </p>
              </div>

              {(errorMsg || tabsError) && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400 flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg || tabsError}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tab Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t('sheets.selectTab')} ({tabs.length} {t('sheets.tabCount')})
              </h3>
              
              {tabsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 border border-neutral-100 dark:border-neutral-900 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/50 animate-pulse" />
                  ))}
                </div>
              ) : tabs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileSpreadsheet className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  {t('sheets.noTabs')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.title}
                      onClick={() => handleTabSelect(tab.title)}
                      disabled={previewLoading}
                      className={cn(
                        "flex flex-col items-start p-4 text-left border rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-xs group cursor-pointer",
                        selectedTab === tab.title
                          ? "border-violet-600 bg-violet-50/30 dark:bg-violet-950/10 dark:border-violet-500 ring-2 ring-violet-500/20"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-950"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1 w-full justify-between">
                        <span className="font-semibold text-sm truncate max-w-[80%] text-neutral-900 dark:text-neutral-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          {tab.title}
                        </span>
                        {selectedTab === tab.title && (
                          <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 pointer-events-none text-[10px] px-1.5 py-0">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">
                        {tab.rowCount} rows • {tab.columnCount} columns
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {previewLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  Loading tab data...
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400 flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview and Configuration */}
          {step === 3 && preview && (
            <div className="space-y-6">
              
              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {t('sheets.preview')} ({t('sheets.previewRows')})
                  </span>
                  <span className="text-xs text-neutral-500">
                    Total: {preview.totalRows} rows
                  </span>
                </div>
                
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden max-h-[160px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        {preview.columns.map((col) => (
                          <th key={col.name} className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-300 min-w-[120px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="truncate">{col.name}</span>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[9px] w-fit px-1 py-0 pointer-events-none font-normal leading-none",
                                  col.type === 'number' && "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
                                  col.type === 'date' && "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400",
                                  col.type === 'category' && "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400",
                                  col.type === 'text' && "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                )}
                              >
                                {col.type}
                              </Badge>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900 bg-white dark:bg-neutral-950">
                      {preview.previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                          {preview.columns.map((col) => (
                            <td key={col.name} className="px-3 py-2 text-neutral-600 dark:text-neutral-400 truncate max-w-[150px]">
                              {row[col.name] !== null ? String(row[col.name]) : <span className="text-neutral-300 dark:text-neutral-700">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Dataset Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="dataset-name" className="text-xs font-semibold">
                    {t('sheets.datasetName')}
                  </Label>
                  <Input
                    id="dataset-name"
                    value={datasetName}
                    onChange={(e) => {
                      setDatasetName(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder={t('sheets.datasetNamePlaceholder')}
                    className="border-neutral-200 dark:border-neutral-800 h-10 focus:ring-violet-500"
                  />
                </div>

                {/* Auto Sync Settings */}
                <div className="space-y-1.5">
                  <Label htmlFor="sync-interval" className="text-xs font-semibold flex items-center justify-between">
                    <span>{t('sheets.syncInterval')}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">Auto-Sync</span>
                  </Label>
                  
                  <div className="flex gap-2">
                    <Select 
                      value={String(syncInterval)} 
                      onValueChange={(val) => setSyncInterval(Number(val))}
                      disabled={!syncEnabled}
                    >
                      <SelectTrigger id="sync-interval" className="border-neutral-200 dark:border-neutral-800 h-10 w-full">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 {t('sheets.seconds')}</SelectItem>
                        <SelectItem value="30">30 {t('sheets.seconds')}</SelectItem>
                        <SelectItem value="60">1 {t('sheets.minutes')}</SelectItem>
                        <SelectItem value="120">2 {t('sheets.minutes')}</SelectItem>
                        <SelectItem value="300">5 {t('sheets.minutes')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>

              {/* Toggle Auto Sync Row */}
              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100 dark:border-neutral-900">
                <button
                  type="button"
                  role="switch"
                  aria-checked={syncEnabled}
                  onClick={() => setSyncEnabled(!syncEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                    syncEnabled ? "bg-violet-600" : "bg-neutral-200 dark:bg-neutral-800"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      syncEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
                <Label htmlFor="auto-sync" className="text-sm cursor-pointer select-none">
                  {t('sheets.autoSync')}
                </Label>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400 flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10 flex justify-between items-center">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => {
                setStep(step - 1);
                setErrorMsg(null);
              }}
              className="border-neutral-200 dark:border-neutral-800"
              disabled={importing || previewLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t('sheets.back')}
            </Button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <Button
              onClick={handleConnect}
              disabled={!isValidUrl || tabsLoading}
              className="bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
            >
              {tabsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  {t('sheets.connectBtn')}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          )}

          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => handleTabSelect(selectedTab)}
              disabled={!selectedTab || previewLoading}
              className="border-violet-200 hover:bg-violet-50 text-violet-600 dark:border-violet-900 dark:hover:bg-violet-950/30"
            >
              {previewLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Preview Data
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm font-semibold"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t('sheets.importing')}
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-1.5" />
                  {t('sheets.import')}
                </>
              )}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
