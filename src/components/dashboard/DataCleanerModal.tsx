'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Trash2,
  AlertTriangle,
  Check,
  ChevronRight,
  Info,
  Loader2,
  Eye,
  Wand2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnInfo } from '@/types/csv';
import {
  CleaningOptions,
  CleaningSummary,
  CleaningResult,
  CaseNormalizationStrategy,
  MissingValueStrategy,
} from '@/types/data-cleaner';
import {
  analyzeDataForCleaning,
  generateCleaningPreview,
  cleanData,
  getDefaultCleaningOptions,
} from '@/lib/data-cleaner';
import { useLanguage } from '@/context/LanguageContext';

type DataRow = Record<string, string | number | Date | null>;

interface DataCleanerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DataRow[];
  columns: ColumnInfo[];
  onCleanComplete: (cleanedData: DataRow[], result: CleaningResult) => void;
}

export function DataCleanerModal({
  open,
  onOpenChange,
  data,
  columns,
  onCleanComplete,
}: DataCleanerModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'analyze' | 'configure' | 'preview' | 'result'>('analyze');
  const [options, setOptions] = useState<CleaningOptions>(getDefaultCleaningOptions());
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CleaningResult | null>(null);

  // Analyze data on mount
  const summary = useMemo<CleaningSummary>(() => {
    return analyzeDataForCleaning(data, columns);
  }, [data, columns]);

  // Generate preview based on current options
  const preview = useMemo(() => {
    return generateCleaningPreview(data, columns, options);
  }, [data, columns, options]);

  const hasIssues = summary.totalIssues > 0;

  const handleOptionChange = useCallback(
    <K extends keyof CleaningOptions>(key: K, value: CleaningOptions[K]) => {
      setOptions(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleApplyCleaning = useCallback(async () => {
    setIsProcessing(true);

    // Simulate async operation for smooth UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const { cleanedRows, result } = cleanData(data, columns, options);
    setResult(result);
    setStep('result');
    setIsProcessing(false);

    // Don't close yet - show result first
  }, [data, columns, options]);

  const handleConfirmAndClose = useCallback(() => {
    if (result) {
      const { cleanedRows } = cleanData(data, columns, options);
      onCleanComplete(cleanedRows, result);
    }
    onOpenChange(false);
    setStep('analyze');
    setResult(null);
    setOptions(getDefaultCleaningOptions());
  }, [result, data, columns, options, onCleanComplete, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    setStep('analyze');
    setResult(null);
    setOptions(getDefaultCleaningOptions());
  }, [onOpenChange]);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'duplicate':
        return '🔄';
      case 'missing':
        return '⚠️';
      case 'whitespace':
        return '📏';
      case 'inconsistent_case':
        return '🔤';
      default:
        return '❓';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('dataCleaner.title') || 'Data Cleaner'}
              </DialogTitle>
              <DialogDescription>
                {t('dataCleaner.description') || 'Analyze and clean your data to ensure quality'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 py-4">
          {(['analyze', 'configure', 'preview', 'result'] as const).map((s, index) => (
            <React.Fragment key={s}>
              <button
                onClick={() => s !== 'result' && result === null && setStep(s)}
                disabled={s === 'result'}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${
                    step === s
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                  ${s === 'result' && !result ? 'opacity-50' : ''}
                `}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step === s ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="hidden sm:inline capitalize">{s}</span>
              </button>
              {index < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-1">
          {/* Step 1: Analyze */}
          {step === 'analyze' && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card
                className={
                  hasIssues ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        hasIssues ? 'bg-amber-100' : 'bg-green-100'
                      }`}
                    >
                      {hasIssues ? (
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      ) : (
                        <Check className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {hasIssues
                          ? `${summary.totalIssues} issues found`
                          : 'Your data looks clean!'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {hasIssues
                          ? 'Review the issues below and configure cleaning options'
                          : 'No data quality issues detected in your dataset'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{summary.totalRows}</div>
                      <div className="text-xs text-muted-foreground">total rows</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues List */}
              {hasIssues && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Detected Issues
                  </h4>
                  <div className="grid gap-3">
                    {summary.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        <span className="text-xl">{getIssueIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium">{issue.description}</div>
                          {issue.column && (
                            <div className="text-xs opacity-75">Column: {issue.column}</div>
                          )}
                        </div>
                        <Badge variant="outline" className={`${getSeverityColor(issue.severity)}`}>
                          {issue.count} {issue.count === 1 ? 'issue' : 'issues'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xl font-bold text-violet-600">
                    {summary.duplicateRows.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Duplicates</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xl font-bold text-amber-600">
                    {Object.values(summary.missingValuesByColumn).reduce(
                      (sum, arr) => sum + arr.length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Missing Values</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {Object.values(summary.whitespaceIssues).reduce(
                      (sum, arr) => sum + arr.length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Whitespace Issues</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {Object.keys(summary.caseInconsistencies).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Case Issues</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Duplicate Handling */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="removeDuplicates"
                    checked={options.removeDuplicates}
                    onCheckedChange={checked =>
                      handleOptionChange('removeDuplicates', checked === true)
                    }
                  />
                  <Label htmlFor="removeDuplicates" className="flex-1 cursor-pointer">
                    <div className="font-medium">Remove Duplicate Rows</div>
                    <div className="text-sm text-muted-foreground">
                      Remove rows that are exact copies of other rows
                    </div>
                  </Label>
                  {summary.duplicateRows.length > 0 && (
                    <Badge variant="secondary">{summary.duplicateRows.length} found</Badge>
                  )}
                </div>
              </div>

              {/* Empty Rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="removeEmptyRows"
                    checked={options.removeEmptyRows}
                    onCheckedChange={checked =>
                      handleOptionChange('removeEmptyRows', checked === true)
                    }
                  />
                  <Label htmlFor="removeEmptyRows" className="flex-1 cursor-pointer">
                    <div className="font-medium">Remove Empty Rows</div>
                    <div className="text-sm text-muted-foreground">
                      Remove rows where all cells are empty
                    </div>
                  </Label>
                </div>
              </div>

              {/* Whitespace */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="trimWhitespace"
                    checked={options.trimWhitespace}
                    onCheckedChange={checked =>
                      handleOptionChange('trimWhitespace', checked === true)
                    }
                  />
                  <Label htmlFor="trimWhitespace" className="flex-1 cursor-pointer">
                    <div className="font-medium">Trim Whitespace</div>
                    <div className="text-sm text-muted-foreground">
                      Remove leading/trailing spaces and collapse multiple spaces
                    </div>
                  </Label>
                  {Object.values(summary.whitespaceIssues).reduce(
                    (sum, arr) => sum + arr.length,
                    0
                  ) > 0 && (
                    <Badge variant="secondary">
                      {Object.values(summary.whitespaceIssues).reduce(
                        (sum, arr) => sum + arr.length,
                        0
                      )}{' '}
                      found
                    </Badge>
                  )}
                </div>
              </div>

              {/* Case Normalization */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="normalizeCase"
                    checked={options.normalizeCase}
                    onCheckedChange={checked =>
                      handleOptionChange('normalizeCase', checked === true)
                    }
                  />
                  <Label htmlFor="normalizeCase" className="flex-1 cursor-pointer">
                    <div className="font-medium">Normalize Text Case</div>
                    <div className="text-sm text-muted-foreground">
                      Standardize text capitalization across cells
                    </div>
                  </Label>
                </div>
                {options.normalizeCase && (
                  <div className="ml-7 pl-4 border-l-2 border-violet-200">
                    <Select
                      value={options.caseStrategy}
                      onValueChange={value =>
                        handleOptionChange('caseStrategy', value as CaseNormalizationStrategy)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select case style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lowercase">lowercase</SelectItem>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="titlecase">Title Case</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Missing Values */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="handleMissingValues"
                    checked={options.handleMissingValues}
                    onCheckedChange={checked =>
                      handleOptionChange('handleMissingValues', checked === true)
                    }
                  />
                  <Label htmlFor="handleMissingValues" className="flex-1 cursor-pointer">
                    <div className="font-medium">Handle Missing Values</div>
                    <div className="text-sm text-muted-foreground">
                      Fill or remove cells with missing data
                    </div>
                  </Label>
                  {Object.values(summary.missingValuesByColumn).reduce(
                    (sum, arr) => sum + arr.length,
                    0
                  ) > 0 && (
                    <Badge variant="secondary">
                      {Object.values(summary.missingValuesByColumn).reduce(
                        (sum, arr) => sum + arr.length,
                        0
                      )}{' '}
                      found
                    </Badge>
                  )}
                </div>
                {options.handleMissingValues && (
                  <div className="ml-7 pl-4 border-l-2 border-violet-200 space-y-3">
                    <Select
                      value={options.missingValueStrategy}
                      onValueChange={value =>
                        handleOptionChange('missingValueStrategy', value as MissingValueStrategy)
                      }
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remove_row">Remove rows with missing values</SelectItem>
                        <SelectItem value="fill_empty">Fill with empty string</SelectItem>
                        <SelectItem value="fill_zero">Fill with 0 (numbers)</SelectItem>
                        <SelectItem value="fill_average">Fill with average (numbers)</SelectItem>
                        <SelectItem value="fill_median">Fill with median (numbers)</SelectItem>
                        <SelectItem value="fill_mode">Fill with most common value</SelectItem>
                        <SelectItem value="fill_custom">Fill with custom value</SelectItem>
                      </SelectContent>
                    </Select>
                    {options.missingValueStrategy === 'fill_custom' && (
                      <Input
                        placeholder="Enter custom value..."
                        value={options.customFillValue || ''}
                        onChange={e => handleOptionChange('customFillValue', e.target.value)}
                        className="w-64"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <Card className="border-violet-200 bg-violet-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Eye className="h-8 w-8 text-violet-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Preview Changes</h3>
                      <p className="text-sm text-muted-foreground">
                        Review what will happen when you apply cleaning
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Trash2 className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold text-red-600">
                      {preview.estimatedRemovals}
                    </div>
                    <div className="text-sm text-muted-foreground">Rows to Remove</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <div className="text-2xl font-bold text-amber-600">
                      {preview.estimatedModifications}
                    </div>
                    <div className="text-sm text-muted-foreground">Cells to Modify</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold text-green-600">
                      {data.length - preview.estimatedRemovals}
                    </div>
                    <div className="text-sm text-muted-foreground">Final Row Count</div>
                  </CardContent>
                </Card>
              </div>

              {/* Applied Options Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Applied Cleaning Options</h4>
                <div className="flex flex-wrap gap-2">
                  {options.removeDuplicates && <Badge variant="secondary">Remove Duplicates</Badge>}
                  {options.removeEmptyRows && <Badge variant="secondary">Remove Empty Rows</Badge>}
                  {options.trimWhitespace && <Badge variant="secondary">Trim Whitespace</Badge>}
                  {options.normalizeCase && (
                    <Badge variant="secondary">Normalize Case ({options.caseStrategy})</Badge>
                  )}
                  {options.handleMissingValues && (
                    <Badge variant="secondary">
                      Missing Values ({options.missingValueStrategy.replace('_', ' ')})
                    </Badge>
                  )}
                </div>
              </div>

              {preview.estimatedRemovals === 0 && preview.estimatedModifications === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                  <Info className="h-5 w-5 text-amber-600" />
                  <div className="text-sm text-amber-700">
                    No changes will be made with the current options. Try enabling more cleaning
                    options.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">Cleaning Complete!</h3>
                  <p className="text-muted-foreground">Your data has been successfully cleaned</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{result.originalRowCount}</div>
                  <div className="text-xs text-muted-foreground">Original Rows</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{result.removedRows}</div>
                  <div className="text-xs text-muted-foreground">Removed</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">{result.modifiedCells}</div>
                  <div className="text-xs text-muted-foreground">Cells Modified</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{result.cleanedRowCount}</div>
                  <div className="text-xs text-muted-foreground">Final Rows</div>
                </div>
              </div>

              {/* Change Log (limited) */}
              {result.changes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Recent Changes (showing {Math.min(result.changes.length, 10)} of{' '}
                    {result.changes.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.changes.slice(0, 10).map((change, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-muted/30 rounded flex items-center gap-2"
                      >
                        {change.type === 'removed_row' ? (
                          <Trash2 className="h-3 w-3 text-red-500" />
                        ) : (
                          <RefreshCw className="h-3 w-3 text-amber-500" />
                        )}
                        <span className="text-muted-foreground">{change.reason}</span>
                        {change.column && (
                          <Badge variant="outline" className="text-xs">
                            {change.column}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4 shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={handleCancel}>
              {result ? 'Discard Changes' : 'Cancel'}
            </Button>
            <div className="flex gap-2">
              {step !== 'analyze' && step !== 'result' && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setStep(
                      step === 'configure'
                        ? 'analyze'
                        : step === 'preview'
                        ? 'configure'
                        : 'analyze'
                    )
                  }
                >
                  Back
                </Button>
              )}
              {step === 'analyze' && (
                <Button
                  onClick={() => setStep('configure')}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  Configure Cleaning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {step === 'configure' && (
                <Button
                  onClick={() => setStep('preview')}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  <Eye className="h-4 w-4" />
                  Preview Changes
                </Button>
              )}
              {step === 'preview' && (
                <Button
                  onClick={handleApplyCleaning}
                  disabled={isProcessing}
                  className="gap-2 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Apply Cleaning
                    </>
                  )}
                </Button>
              )}
              {step === 'result' && (
                <Button
                  onClick={handleConfirmAndClose}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Save & Close
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
