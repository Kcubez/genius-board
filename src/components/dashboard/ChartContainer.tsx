'use client';

import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnInfo } from '@/types/csv';
import { aggregateByColumn, formatNumber } from '@/lib/kpi-calculator';
import { useLanguage } from '@/context/LanguageContext';

const COLORS = [
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// Custom Premium Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    name?: string;
    color?: string;
    payload?: {
      name?: string;
      fullName?: string;
      fill?: string;
      percent?: number;
    };
  }>;
  label?: string;
  valueLabel?: string;
  showCurrency?: boolean;
  accentColor?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  valueLabel,
  showCurrency,
  accentColor,
}: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value as number;
  // Use fullName (with year) if available, otherwise use name or label
  const name = payload[0]?.payload?.fullName || payload[0]?.payload?.name || label;
  const color = accentColor || payload[0]?.payload?.fill || payload[0]?.color || '#8b5cf6';

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30 animate-in fade-in-0 zoom-in-95 duration-200">
      {/* Gradient accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />

      <div className="px-4 py-3 space-y-2">
        {/* Label / Name */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{name}</span>
        </div>

        {/* Value */}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {valueLabel || 'Value'}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {formatNumber(value || 0, showCurrency ? 'currency' : 'number')}
            {showCurrency && <span className="text-sm font-medium text-gray-500 ml-1">Ks</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

// Pie Chart specific tooltip
const PieTooltip = ({ active, payload, valueLabel, showCurrency }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const value = data?.value as number;
  const name = data?.name || data?.payload?.name;
  const color = data?.payload?.fill || '#8b5cf6';
  const percent = data?.payload?.percent;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30 animate-in fade-in-0 zoom-in-95 duration-200">
      {/* Gradient accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />

      <div className="px-4 py-3 space-y-2">
        {/* Label / Name */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{name}</span>
          {percent !== undefined && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {(percent * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {valueLabel || 'Value'}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {formatNumber(value || 0, showCurrency ? 'currency' : 'number')}
            {showCurrency && <span className="text-sm font-medium text-gray-500 ml-1">Ks</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ChartContainerProps {
  data: Record<string, string | number | Date | null>[];
  columns: ColumnInfo[];
  isLoading?: boolean;
}

// Skeleton component for loading state
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-linear-to-r from-muted/50 via-muted to-muted/50 rounded-lg"
      style={{ height }}
    >
      <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
        <div className="w-12 h-12 rounded-full bg-muted-foreground/10" />
        <div className="space-y-2 w-full max-w-50">
          <div className="h-2 bg-muted-foreground/10 rounded w-full" />
          <div className="h-2 bg-muted-foreground/10 rounded w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// Bar chart skeleton with animated bars
function BarChartSkeleton() {
  return (
    <div className="animate-pulse p-4 space-y-3" style={{ height: 280 }}>
      {[0.9, 0.75, 0.6, 0.85, 0.5, 0.7].map((width, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 h-3 bg-muted-foreground/10 rounded" />
          <div
            className="h-6 bg-linear-to-r from-violet-200/50 to-purple-200/50 rounded"
            style={{ width: `${width * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// Pie chart skeleton
function PieChartSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-center p-6" style={{ height: 280 }}>
      <div className="relative">
        <div className="w-48 h-48 rounded-full bg-linear-to-br from-violet-200/30 via-purple-200/30 to-pink-200/30" />
        <div className="absolute inset-8 rounded-full bg-background" />
      </div>
    </div>
  );
}

// Line chart skeleton
function LineChartSkeleton() {
  return (
    <div className="animate-pulse p-6" style={{ height: 280 }}>
      <div className="h-full flex items-end gap-1">
        {[40, 60, 45, 80, 55, 70, 90, 65, 85, 75, 95, 60].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-linear-to-t from-violet-200/50 to-transparent rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="w-8 h-2 bg-muted-foreground/10 rounded" />
        ))}
      </div>
    </div>
  );
}

export function ChartContainer({ data, columns, isLoading = false }: ChartContainerProps) {
  const { t } = useLanguage();
  const [groupByColumn, setGroupByColumn] = React.useState<string>('');
  const [valueColumn, setValueColumn] = React.useState<string>('');
  const [timeSeriesValueColumn, setTimeSeriesValueColumn] = React.useState<string>('');
  const [reportType, setReportType] = React.useState<string>('custom');

  // Helper to detect if a column is likely a currency/money column
  const isCurrencyColumn = (columnName: string): boolean => {
    const currencyHints = [
      'price',
      'amount',
      'total',
      'revenue',
      'sales',
      'cost',
      'value',
      'payment',
      'fee',
    ];
    const lowerName = columnName.toLowerCase();
    return currencyHints.some(hint => lowerName.includes(hint));
  };

  const textColumns = columns.filter(c => c.type === 'category' || c.type === 'text');
  const numberColumns = columns.filter(c => c.type === 'number');
  const dateColumn = columns.find(c => c.type === 'date');

  // Generate report type presets based on available columns
  // Auto-generate ALL combinations of text/category columns × number columns
  const reportPresets = useMemo(() => {
    const presets: { value: string; label: string; groupBy: string; valueCol: string }[] = [
      { value: 'custom', label: '⚙️ Custom Report', groupBy: '', valueCol: '' },
    ];

    // Filter out ID-like columns from number columns (not useful for reports)
    const meaningfulNumberColumns = numberColumns.filter(c => {
      const lowerName = c.name.toLowerCase();
      return (
        !lowerName.includes('id') && !lowerName.includes('index') && !lowerName.includes('_id')
      );
    });

    // Generate all combinations of text columns × number columns
    textColumns.forEach(textCol => {
      meaningfulNumberColumns.forEach(numCol => {
        const groupByName = textCol.name;
        const valueName = numCol.name;

        // Create a unique key for the preset
        const presetKey = `${groupByName.toLowerCase().replace(/\s+/g, '-')}-by-${valueName.toLowerCase().replace(/\s+/g, '-')}`;

        // Create a readable label
        const label = `${valueName} by ${groupByName}`;

        presets.push({
          value: presetKey,
          label,
          groupBy: groupByName,
          valueCol: valueName,
        });
      });
    });

    return presets;
  }, [textColumns, numberColumns]);

  // Handle report type change
  const handleReportTypeChange = (value: string) => {
    setReportType(value);
    const preset = reportPresets.find(p => p.value === value);
    if (preset && preset.groupBy && preset.valueCol) {
      setGroupByColumn(preset.groupBy);
      setValueColumn(preset.valueCol);
    }
  };

  // Auto-select columns on first load
  React.useEffect(() => {
    const categoryCol = columns.find(c => c.type === 'category' || c.type === 'text');
    const numberCol = columns.find(c => c.type === 'number');

    if (categoryCol && !groupByColumn) setGroupByColumn(categoryCol.name);
    if (numberCol && !valueColumn) setValueColumn(numberCol.name);
  }, [columns, groupByColumn, valueColumn]);

  // Get money-related columns for the time series dropdown
  const moneyColumns = useMemo(() => {
    const moneyHints = [
      'amount',
      'total',
      'sales',
      'revenue',
      'price',
      'value',
      'cost',
      'payment',
      'fee',
      'profit',
      'discount',
    ];

    // Filter number columns that look like money columns
    const filtered = numberColumns.filter(c => {
      const lowerName = c.name.toLowerCase();
      // Exclude ID columns
      if (lowerName.includes('id') || lowerName.includes('index')) return false;
      // Include if matches money hints
      return moneyHints.some(hint => lowerName.includes(hint));
    });

    // If no money columns found, return all non-ID number columns
    if (filtered.length === 0) {
      return numberColumns.filter(
        c => !c.name.toLowerCase().includes('id') && !c.name.toLowerCase().includes('index')
      );
    }

    return filtered;
  }, [numberColumns]);

  // Auto-select first money column for time series if not set
  React.useEffect(() => {
    if (!timeSeriesValueColumn && moneyColumns.length > 0) {
      setTimeSeriesValueColumn(moneyColumns[0].name);
    }
  }, [moneyColumns, timeSeriesValueColumn]);

  const chartData = useMemo(() => {
    if (!groupByColumn || !valueColumn || data.length === 0) return [];
    return aggregateByColumn(data, groupByColumn, valueColumn, 'sum').slice(0, 10).map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));
  }, [data, groupByColumn, valueColumn]);

  // Time series - aggregate by MONTH, show last 6 months
  const timeSeriesData = useMemo(() => {
    if (!dateColumn || !timeSeriesValueColumn || data.length === 0) return [];

    // Group by MONTH (YYYY-MM format)
    const monthGroups = new Map<string, number>();

    data.forEach(row => {
      const dateValue = row[dateColumn.name];
      if (!dateValue) return;

      let monthKey: string;
      const dateStr = String(dateValue);

      // Try to extract YYYY-MM from various formats
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})/);

      if (isoMatch) {
        monthKey = `${isoMatch[1]}-${isoMatch[2]}`; // "2025-07"
      } else {
        // Try other formats
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) return;

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        monthKey = `${year}-${month}`;
      }

      const value = Number(row[timeSeriesValueColumn]) || 0;
      monthGroups.set(monthKey, (monthGroups.get(monthKey) || 0) + value);
    });

    // Convert to array and sort by month
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const sortedData = Array.from(monthGroups.entries())
      .map(([monthStr, value]) => {
        const [year, month] = monthStr.split('-').map(Number);
        const monthName = monthNames[month - 1];
        return {
          monthStr,
          name: `${monthName} ${year}`, // "Jul 2025"
          fullName: `${monthName} ${year}`, // "Jul 2025"
          value,
        };
      })
      .sort((a, b) => a.monthStr.localeCompare(b.monthStr));

    // Show last 12 months (1 year)
    return sortedData.slice(-12);
  }, [data, dateColumn, timeSeriesValueColumn]);

  const showCurrency = isCurrencyColumn(valueColumn);
  const timeSeriesShowCurrency = isCurrencyColumn(timeSeriesValueColumn);

  // Show loading skeletons while data is being processed
  if (isLoading || data.length === 0) {
    if (data.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-violet-500"
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('common.noRecordFound')}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t('common.noRecordFoundHint')}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 lg:space-y-6">
        {/* Skeleton for selectors */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-4 bg-muted animate-pulse rounded" />
            <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
          </div>
        </div>

        {/* Charts Grid Skeletons */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
          {/* Line Chart Skeleton */}
          <Card>
            <CardHeader className="pb-2">
              <div className="w-40 h-5 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <LineChartSkeleton />
            </CardContent>
          </Card>

          {/* Bar Chart Skeleton */}
          <Card>
            <CardHeader className="pb-2">
              <div className="w-48 h-5 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <BarChartSkeleton />
            </CardContent>
          </Card>

          {/* Pie Chart Skeleton */}
          <Card>
            <CardHeader className="pb-2">
              <div className="w-36 h-5 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <PieChartSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Report Config Card */}
      <div className="dash-card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-violet-100/60 dark:border-violet-900/20 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-xs text-white font-bold">📊</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            Report Configuration
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:flex-wrap">
            {/* Report Type Presets */}
            {reportPresets.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  Report Type:
                </span>
                <Select value={reportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger className="w-full sm:w-56 h-9 sm:h-10 text-sm border-violet-200 dark:border-violet-800 focus:ring-violet-400">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportPresets.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Column Selectors */}
            {reportType === 'custom' && (
              <>
                <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Group by:
                    </span>
                    <Select value={groupByColumn} onValueChange={setGroupByColumn}>
                      <SelectTrigger className="w-full sm:w-36 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {textColumns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Value:
                    </span>
                    <Select value={valueColumn} onValueChange={setValueColumn}>
                      <SelectTrigger className="w-full sm:w-36 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {numberColumns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts — Side by Side */}
      <div className="grid gap-4 lg:gap-5 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-100/60 dark:border-violet-900/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Top 10 {groupByColumn}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">by {valueColumn}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 40)}>
              <RechartsBarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatNumber(v, 'number')}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={115}
                  interval={0}
                />
                <Tooltip
                  content={<CustomTooltip valueLabel={valueColumn} showCurrency={showCurrency} />}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                  fillOpacity={1}
                  activeBar={{ fillOpacity: 1, stroke: 'none' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut / Pie Chart */}
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-100/60 dark:border-violet-900/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Top 10 breakdown</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <ResponsiveContainer width={200} height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.slice(0, 10).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<PieTooltip valueLabel={valueColumn} showCurrency={showCurrency} />}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                {chartData.slice(0, 10).map((entry, index) => {
                  const totalValue = chartData.slice(0, 10).reduce((sum, d) => sum + (d.value as number), 0);
                  const percent = ((entry.value as number) / totalValue) * 100;
                  return (
                    <div key={index} className="flex items-center gap-2.5 group cursor-pointer">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-shrink-0 w-20 lg:w-24" title={entry.name as string}>
                        {entry.name}
                      </span>
                      <div className="flex-1 min-w-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-10 text-right flex-shrink-0">
                        {percent.toFixed(0)}%
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 w-16 lg:w-20 text-right tabular-nums flex-shrink-0 truncate" title={formatNumber(entry.value as number, showCurrency ? 'currency' : 'number')}>
                        {formatNumber(entry.value as number, showCurrency ? 'currency' : 'number')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Over Time — Full Width */}
      {dateColumn && timeSeriesData.length > 0 && (
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-4 border-b border-violet-100/60 dark:border-violet-900/20 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Trend Over Time</h3>
                <p className="text-xs text-slate-400">Last 12 months</p>
              </div>
            </div>
            <Select value={timeSeriesValueColumn} onValueChange={setTimeSeriesValueColumn}>
              <SelectTrigger className="w-auto min-w-40 h-8 text-xs border-violet-200 dark:border-violet-800">
                <SelectValue placeholder="Select value" />
              </SelectTrigger>
              <SelectContent>
                {moneyColumns.map(col => (
                  <SelectItem key={col.name} value={col.name} className="text-xs">
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={timeSeriesData}
                margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tickFormatter={v => formatNumber(v, timeSeriesShowCurrency ? 'currency' : 'number')}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      valueLabel={timeSeriesValueColumn}
                      showCurrency={timeSeriesShowCurrency}
                      accentColor="#8b5cf6"
                    />
                  }
                  cursor={{ stroke: 'rgba(139,92,246,0.15)', strokeWidth: 40, strokeLinecap: 'round' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="transparent"
                  fill="url(#areaGradient)"
                  strokeWidth={0}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
                />
                {timeSeriesData.length > 0 && (() => {
                  const avg = timeSeriesData.reduce((sum, d) => sum + (d.value as number), 0) / timeSeriesData.length;
                  return (
                    <ReferenceLine
                      y={avg}
                      stroke="#8b5cf6"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                      label={{
                        value: 'Avg',
                        position: 'right',
                        fontSize: 10,
                        fill: '#94a3b8',
                        dx: -4,
                      }}
                    />
                  );
                })()}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
