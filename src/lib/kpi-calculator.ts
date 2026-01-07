import { KpiData, KpiConfig, KPI_COLUMN_HINTS } from '@/types/dashboard';
import { ColumnInfo } from '@/types/csv';

// Auto-detect KPI columns based on hints
export function detectKpiColumns(columns: ColumnInfo[]): KpiConfig {
  const config: KpiConfig = {
    salesColumn: null,
    quantityColumn: null,
    customerColumn: null,
    dateColumn: null,
  };

  const findColumn = (hints: readonly string[], type?: ColumnInfo['type']): string | null => {
    for (const hint of hints) {
      const match = columns.find(
        col => col.name.toLowerCase().includes(hint) && (!type || col.type === type)
      );
      if (match) return match.name;
    }
    return null;
  };

  // Find sales/amount column (must be number)
  config.salesColumn = findColumn(KPI_COLUMN_HINTS.sales, 'number');

  // Find quantity column (must be number)
  config.quantityColumn = findColumn(KPI_COLUMN_HINTS.quantity, 'number');

  // Find customer column (text or category)
  config.customerColumn =
    findColumn(KPI_COLUMN_HINTS.customer) ||
    columns.find(col => col.type === 'category' || col.type === 'text')?.name ||
    null;

  // Find date column
  config.dateColumn =
    findColumn(KPI_COLUMN_HINTS.date, 'date') ||
    columns.find(col => col.type === 'date')?.name ||
    null;

  // Fallback: if no sales column found, use the first number column
  if (!config.salesColumn) {
    config.salesColumn = columns.find(col => col.type === 'number')?.name || null;
  }

  return config;
}

// Calculate KPIs from filtered data
export function calculateKpis(
  data: Record<string, string | number | Date | null>[],
  config: KpiConfig
): KpiData {
  const kpis: KpiData = {
    totalSales: 0,
    totalOrders: data.length,
    totalQuantity: 0,
    averageOrderValue: 0,
    uniqueCustomers: 0,
  };

  if (data.length === 0) return kpis;

  // Calculate Total Sales
  if (config.salesColumn) {
    kpis.totalSales = data.reduce((sum, row) => {
      const value = row[config.salesColumn!];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  // Calculate Total Quantity
  if (config.quantityColumn) {
    kpis.totalQuantity = data.reduce((sum, row) => {
      const value = row[config.quantityColumn!];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  // Calculate Average Order Value
  if (kpis.totalOrders > 0 && kpis.totalSales > 0) {
    kpis.averageOrderValue = kpis.totalSales / kpis.totalOrders;
  }

  // Calculate Unique Customers
  if (config.customerColumn) {
    const uniqueCustomers = new Set(
      data
        .map(row => row[config.customerColumn!])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => String(v))
    );
    kpis.uniqueCustomers = uniqueCustomers.size;
  }

  return kpis;
}

// Format number for display
export function formatNumber(
  value: number,
  type: 'currency' | 'number' | 'decimal' = 'number'
): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (type === 'decimal') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US').format(value);
}

// Aggregate data by column for charts
export function aggregateByColumn(
  data: Record<string, string | number | Date | null>[],
  groupByColumn: string,
  valueColumn: string,
  aggregation: 'sum' | 'count' | 'average' = 'sum'
): { name: string; value: number }[] {
  const groups = new Map<string, number[]>();

  data.forEach(row => {
    const groupKey = String(row[groupByColumn] ?? 'Unknown');
    const value = Number(row[valueColumn]) || 0;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(value);
  });

  return Array.from(groups.entries())
    .map(([name, values]) => {
      let value: number;
      switch (aggregation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'count':
          value = values.length;
          break;
        case 'average':
          value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
      }
      return { name, value };
    })
    .sort((a, b) => b.value - a.value);
}
