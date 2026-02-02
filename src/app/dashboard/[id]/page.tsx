'use client';

import React, { useMemo, useCallback, useState, useEffect, useDeferredValue, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Download,
  Filter as FilterIcon,
  ChevronDown,
  Loader2,
  LayoutGrid,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { EditableTable } from '@/components/csv/EditableTable';
import { DataCleanerModal } from '@/components/dashboard/DataCleanerModal';
import { useLanguage } from '@/context/LanguageContext';
import { Filter } from '@/types/filter';
import { ColumnInfo, CsvData } from '@/types/csv';
import { calculateKpis, detectKpiColumns } from '@/lib/kpi-calculator';
import { convertToCsv, downloadCsv } from '@/lib/csv-parser';
import { CleaningResult } from '@/types/data-cleaner';
import { toast } from 'sonner';

interface DataRow {
  id: string;
  datasetId: string;
  rowIndex: number;
  data: Record<string, unknown>;
}

interface Dataset {
  id: string;
  name: string;
  fileName: string;
  columns: ColumnInfo[];
  rowCount: number;
  rows: DataRow[];
}

export default function DatasetDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const datasetId = params.id as string;
  const { t } = useLanguage();

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [priorityColumn, setPriorityColumn] = useState<string | null>(null);
  const [showDataCleaner, setShowDataCleaner] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch dataset from Supabase
  useEffect(() => {
    async function fetchDataset() {
      try {
        const response = await fetch(`/api/datasets/${datasetId}`);
        const result = await response.json();

        if (result.success) {
          setDataset(result.dataset);
        } else {
          toast.error('Dataset not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching dataset:', error);
        toast.error('Failed to load dataset');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (datasetId) {
      fetchDataset();
    }
  }, [datasetId, router]);

  // Refresh data function - called after CRUD operations
  const refreshData = useCallback(async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`);
      const result = await response.json();
      if (result.success) {
        setDataset(result.dataset);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [datasetId]);

  // Create a structure that keeps row IDs with their data for efficient filtering
  const rowsWithIds = useMemo(() => {
    if (!dataset) return [];
    return dataset.rows.map(row => ({
      id: row.id,
      data: row.data as Record<string, string | number | Date | null>,
    }));
  }, [dataset]);

  // Convert dataset rows to CSV data format
  // Also recalculate uniqueValues for category columns from actual data
  const csvData: CsvData | null = useMemo(() => {
    if (!dataset) return null;

    const rows = rowsWithIds.map(r => r.data);

    // Recalculate uniqueValues for category columns from actual data
    // This ensures filters always reflect the current state of the data
    const columnsWithUpdatedUniqueValues = dataset.columns.map(column => {
      if (column.type === 'category') {
        const uniqueValues = Array.from(
          new Set(
            rows
              .map(row => row[column.name])
              .filter((v): v is string => v != null && v !== '')
              .map(v => String(v))
          )
        ).sort();
        return { ...column, uniqueValues };
      }
      return column;
    });

    return {
      columns: columnsWithUpdatedUniqueValues,
      rows,
      rawHeaders: dataset.columns.map(c => c.name),
      fileName: dataset.fileName,
      totalRows: dataset.rowCount,
    };
  }, [dataset, rowsWithIds]);

  // Sync category filters when data changes (e.g., after row edit)
  // This ensures filter selections stay valid and dropdown options update
  useEffect(() => {
    if (!csvData?.columns || filters.length === 0) return;

    setFilters(prevFilters => {
      let hasChanges = false;
      const updatedFilters = prevFilters.map(filter => {
        if (filter.columnType !== 'category') return filter;

        const column = csvData.columns.find(c => c.name === filter.columnName);
        if (!column || !column.uniqueValues) return filter;

        // Get the new unique values from the recalculated column
        const newUniqueValues = new Set(column.uniqueValues);

        // Filter out any selected values that no longer exist in the data
        const validSelectedValues = filter.values.filter(v => newUniqueValues.has(v));

        // Check if we need to update the filter
        if (validSelectedValues.length !== filter.values.length) {
          hasChanges = true;
          return {
            ...filter,
            values: validSelectedValues.length > 0 ? validSelectedValues : column.uniqueValues,
          };
        }

        return filter;
      });

      // Only update state if there were actual changes
      return hasChanges ? updatedFilters : prevFilters;
    });
  }, [csvData?.columns]);

  // Apply filters to get filtered rows (keeping IDs attached) - O(n) complexity
  const filteredRowsWithIds = useMemo(() => {
    if (!rowsWithIds.length) return [];

    const activeFilters = filters.filter(f => f.isActive);
    if (activeFilters.length === 0) return rowsWithIds;

    return rowsWithIds.filter(({ data: row }) => {
      return activeFilters.every(filter => {
        const value = row[filter.columnName];

        switch (filter.columnType) {
          case 'text':
            const textValue = String(value ?? '').toLowerCase();
            const filterValue = filter.value.toLowerCase();
            switch (filter.operator) {
              case 'equals':
                return textValue === filterValue;
              case 'contains':
                return textValue.includes(filterValue);
              case 'startsWith':
                return textValue.startsWith(filterValue);
              case 'endsWith':
                return textValue.endsWith(filterValue);
              default:
                return true;
            }

          case 'number':
            const numValue = Number(value);
            const filterNum = Number(filter.value);
            const filterMax = filter.valueTo ? Number(filter.valueTo) : filterNum;
            switch (filter.operator) {
              case 'equals':
                return numValue === filterNum;
              case 'greaterThan':
                return numValue > filterNum;
              case 'lessThan':
                return numValue < filterNum;
              case 'between':
                return numValue >= filterNum && numValue <= filterMax;
              default:
                return true;
            }

          case 'date':
            const dateValue = value instanceof Date ? value : new Date(String(value));
            const fromDate = filter.from ? new Date(filter.from) : null;
            const toDate = filter.to ? new Date(filter.to) : null;
            if (filter.operator === 'dateRange') {
              if (fromDate && toDate) {
                return dateValue >= fromDate && dateValue <= toDate;
              } else if (fromDate) {
                return dateValue >= fromDate;
              } else if (toDate) {
                return dateValue <= toDate;
              }
            }
            return true;

          case 'category':
            const selectedValues = filter.values || [];
            if (selectedValues.length === 0) return true;
            return selectedValues.includes(String(value));

          default:
            return true;
        }
      });
    });
  }, [rowsWithIds, filters]);

  // Extract just the data for components that need it
  const filteredData = useMemo(() => {
    return filteredRowsWithIds.map(r => r.data);
  }, [filteredRowsWithIds]);

  // Use deferred values to prevent UI blocking during expensive calculations
  // This allows the UI to remain responsive while filtering/charting runs in background
  const deferredFilteredData = useDeferredValue(filteredData);
  const isFiltering = deferredFilteredData !== filteredData;

  // Calculate KPIs using deferred data for better performance
  const kpiData = useMemo(() => {
    if (!csvData || deferredFilteredData.length === 0) return null;

    const kpiColumns = detectKpiColumns(csvData.columns);
    return calculateKpis(deferredFilteredData, kpiColumns);
  }, [csvData, deferredFilteredData]);

  // Get filtered row IDs - now O(1) since IDs are already attached!
  const filteredRowIds = useMemo(() => {
    return filteredRowsWithIds.map(r => r.id);
  }, [filteredRowsWithIds]);

  // Export handler
  const handleExport = useCallback(() => {
    if (!csvData) return;

    const csvContent = convertToCsv(filteredData, csvData.columns);
    const fileName = `filtered_${csvData.fileName}`;
    downloadCsv(csvContent, fileName);

    toast.success(t('common.success'), {
      description: `Exported ${filteredData.length} rows to ${fileName}`,
    });
  }, [csvData, filteredData, t]);

  // Delete dataset handler
  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        toast.success('Dataset deleted');
        router.push('/dashboard');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }, [datasetId, router]);

  // Data cleaning handler - sends data in chunks to avoid Vercel's size limit
  const handleCleanComplete = useCallback(
    async (
      cleanedData: Record<string, string | number | Date | null>[],
      result: CleaningResult
    ) => {
      setIsCleaning(true);
      try {
        // Chunk size - keep small to stay under Vercel's 4.5MB limit
        const CHUNK_SIZE = 1000;
        const totalRows = cleanedData.length;
        const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

        // If data is small, send all at once
        if (totalRows <= CHUNK_SIZE) {
          const response = await fetch(`/api/datasets/${datasetId}/clean`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cleanedData }),
          });

          const apiResult = await response.json();
          if (!apiResult.success) {
            throw new Error(apiResult.error);
          }
        } else {
          // Send data in chunks for large datasets
          // Show initial progress toast
          toast.loading(`Cleaning data... (0/${totalChunks})`, { id: 'cleaning-progress' });

          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalRows);
            const chunk = cleanedData.slice(start, end);

            // Update progress state
            setCleaningProgress({ current: chunkIndex + 1, total: totalChunks });

            // Update progress toast
            toast.loading(`Cleaning data... (${chunkIndex + 1}/${totalChunks})`, {
              id: 'cleaning-progress',
            });

            const response = await fetch(`/api/datasets/${datasetId}/clean`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cleanedData: chunk,
                chunkIndex,
                totalChunks,
                totalRows,
              }),
            });

            const apiResult = await response.json();
            if (!apiResult.success) {
              toast.dismiss('cleaning-progress');
              throw new Error(apiResult.error || `Failed at chunk ${chunkIndex + 1}`);
            }
          }

          // Dismiss progress toast
          toast.dismiss('cleaning-progress');
          setCleaningProgress(null);
        }

        // Show appropriate toast based on whether any changes were made
        if (result.removedRows === 0 && result.modifiedCells === 0) {
          toast.info(t('dataCleaner.noChangesNeeded') || 'No Changes Needed', {
            description:
              t('dataCleaner.noDataModified') ||
              'Your data is already clean! No modifications were necessary.',
          });
        } else {
          toast.success(t('dataCleaner.cleaningComplete') || 'Cleaning Complete!', {
            description: `Removed ${result.removedRows} rows, modified ${result.modifiedCells} cells`,
          });
        }
        // Refresh the data
        refreshData();
      } catch (error) {
        console.error('Error saving cleaned data:', error);
        toast.error('Failed to save cleaned data');
      } finally {
        setIsCleaning(false);
      }
    },
    [datasetId, refreshData, t]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!csvData || !dataset) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dataset not found</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Back to Datasets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={dataset.name}>
            {dataset.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {csvData.fileName} • {filteredData.length} {t('common.of')} {csvData.totalRows}{' '}
            {t('common.rows')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDataCleaner(true)}
            disabled={isCleaning}
            className="gap-2 border-violet-500 text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
          >
            {isCleaning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{t('dataCleaner.button') || 'Clean Data'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && <KpiCards kpiData={kpiData} />}

      {/* Filter Panel - collapsible with violet accent */}
      <details
        className="group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
        open
      >
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none bg-linear-to-r from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 hover:from-violet-50 hover:to-purple-50/50 dark:hover:from-violet-950/30 dark:hover:to-purple-950/20 transition-colors">
          <span className="font-medium flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <FilterIcon className="h-4 w-4" />
            {t('filter.title')}
            {filters.length > 0 && (
              <Badge className="text-xs bg-violet-600 text-white">
                {filters.filter(f => f.isActive).length} active
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-violet-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="p-4 bg-white dark:bg-slate-900/30">
          <FilterPanel
            columns={csvData.columns}
            filters={filters}
            onAddFilter={filter => setFilters(prev => [...prev, filter])}
            onUpdateFilter={(id, updates) =>
              setFilters(prev =>
                prev.map(f => (f.id === id ? ({ ...f, ...updates } as typeof f) : f))
              )
            }
            onRemoveFilter={id => setFilters(prev => prev.filter(f => f.id !== id))}
            onClearAll={() => setFilters([])}
            onSetPriorityColumn={setPriorityColumn}
            priorityColumn={priorityColumn}
          />
        </div>
      </details>

      {/* Main Content Area */}
      {filteredData.length === 0 && filters.filter(f => f.isActive).length > 0 ? (
        /* Show ONE prominent empty state when filters result in no data */
        <Card className="bg-linear-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/30">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/10">
                <svg
                  className="w-12 h-12 text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t('common.noRecordFound')}
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">{t('common.noRecordFoundHint')}</p>
              <Button
                variant="outline"
                onClick={() => setFilters([])}
                className="gap-2 border-violet-500 text-violet-600 hover:bg-violet-100 hover:text-violet-700 transition-colors"
              >
                <FilterIcon className="h-4 w-4" />
                {t('filter.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Show Charts and Table when there's data */
        <>
          {/* Charts Section */}
          <ChartContainer
            data={deferredFilteredData}
            columns={csvData.columns}
            isLoading={isFiltering}
          />

          {/* Data Table Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Table</CardTitle>
            </CardHeader>
            <CardContent>
              <EditableTable
                data={filteredData}
                columns={csvData.columns}
                datasetId={datasetId}
                rowIds={filteredRowIds}
                onDataChange={refreshData}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Data Cleaner Modal */}
      <DataCleanerModal
        open={showDataCleaner}
        onOpenChange={setShowDataCleaner}
        data={csvData.rows}
        columns={csvData.columns}
        onCleanComplete={handleCleanComplete}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={open => !isDeleting && setShowDeleteModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Report?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete <span className="font-semibold">{dataset.name}</span>?
              This will permanently remove all {dataset.rowCount.toLocaleString()} rows of data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
