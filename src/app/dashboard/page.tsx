'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Filter as FilterIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { CsvTable } from '@/components/csv/CsvTable';
import { useCsvContext } from '@/context/CsvContext';
import { useLanguage } from '@/context/LanguageContext';
import { Filter } from '@/types/filter';
import { calculateKpis, detectKpiColumns } from '@/lib/kpi-calculator';
import { convertToCsv, downloadCsv } from '@/lib/csv-parser';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { csvData, isDataLoaded, clearData } = useCsvContext();
  const { t } = useLanguage();

  const [filters, setFilters] = useState<Filter[]>([]);
  const [priorityColumn, setPriorityColumn] = useState<string | null>(null);

  // Redirect if no data
  React.useEffect(() => {
    if (!isDataLoaded) {
      router.push('/');
    }
  }, [isDataLoaded, router]);

  // Apply filters to get filtered data
  const filteredData = useMemo(() => {
    if (!csvData) return [];

    const activeFilters = filters.filter(f => f.isActive);
    if (activeFilters.length === 0) return csvData.rows;

    return csvData.rows.filter(row => {
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
            if (isNaN(numValue)) return false;
            switch (filter.operator) {
              case 'equals':
                return numValue === filter.value;
              case 'greaterThan':
                return numValue > filter.value;
              case 'lessThan':
                return numValue < filter.value;
              case 'between':
                return numValue >= filter.value && numValue <= (filter.valueTo ?? filter.value);
              default:
                return true;
            }

          case 'category':
            return filter.values.length === 0 || filter.values.includes(String(value));

          case 'date':
            if (!value) return false;
            const dateValue = new Date(value as string | number | Date);
            if (isNaN(dateValue.getTime())) return false;
            const fromMatch = !filter.from || dateValue >= filter.from;
            const toMatch = !filter.to || dateValue <= filter.to;
            return fromMatch && toMatch;

          default:
            return true;
        }
      });
    });
  }, [csvData, filters]);

  // Calculate KPIs from filtered data
  const kpiData = useMemo(() => {
    if (!csvData)
      return {
        totalSales: 0,
        totalOrders: 0,
        totalQuantity: 0,
        averageOrderValue: 0,
        uniqueCustomers: 0,
      };
    const kpiConfig = detectKpiColumns(csvData.columns);
    return calculateKpis(filteredData, kpiConfig);
  }, [filteredData, csvData]);

  // Filter handlers
  const handleAddFilter = useCallback((filter: Filter) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  const handleUpdateFilter = useCallback((id: string, updates: Partial<Filter>) => {
    setFilters(prev => prev.map(f => (f.id === id ? ({ ...f, ...updates } as Filter) : f)));
  }, []);

  const handleRemoveFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters([]);
    setPriorityColumn(null);
  }, []);

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

  // Reset handler
  const handleReset = useCallback(() => {
    clearData();
    router.push('/');
  }, [clearData, router]);

  if (!csvData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {csvData.fileName} • {filteredData.length} {t('common.of')} {csvData.totalRows}{' '}
            {t('common.rows')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">New File</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpiData={kpiData} />

      {/* Main Content Grid - stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
        {/* Filter Panel - collapsible on mobile */}
        <details className="lg:hidden group" open>
          <summary className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer list-none">
            <span className="font-medium flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              {t('filter.title')}
              {filters.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.length}
                </Badge>
              )}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3">
            <FilterPanel
              columns={csvData.columns}
              filters={filters}
              onAddFilter={handleAddFilter}
              onUpdateFilter={handleUpdateFilter}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              onSetPriorityColumn={setPriorityColumn}
              priorityColumn={priorityColumn}
            />
          </div>
        </details>

        {/* Filter Panel - always visible on desktop */}
        <aside className="hidden lg:block space-y-4">
          <FilterPanel
            columns={csvData.columns}
            filters={filters}
            onAddFilter={handleAddFilter}
            onUpdateFilter={handleUpdateFilter}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            onSetPriorityColumn={setPriorityColumn}
            priorityColumn={priorityColumn}
          />
        </aside>

        {/* Main Content - Charts & Table */}
        <div className="space-y-4 lg:space-y-6 min-w-0">
          <Tabs defaultValue="charts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="table">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="mt-4">
              <ChartContainer data={filteredData} columns={csvData.columns} />
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Raw Data</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <CsvTable
                    data={filteredData}
                    columns={csvData.columns}
                    priorityColumn={priorityColumn}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
