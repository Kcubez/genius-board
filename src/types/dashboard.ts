// KPI Types
export interface KpiData {
  totalSales: number;
  totalOrders: number;
  totalQuantity: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  // Profit/Loss KPIs (only calculated if cost data exists)
  totalCost: number;
  totalProfit: number;
  profitMargin: number; // percentage
}

// KPI Config - which columns map to which KPIs
export interface KpiConfig {
  salesColumn: string | null;
  quantityColumn: string | null;
  customerColumn: string | null;
  dateColumn: string | null;
  costColumn: string | null; // for profit/loss calculation
}

// Chart Types
export type ChartType = 'line' | 'bar' | 'pie' | 'table';

// Chart Config
export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxisColumn: string | null;
  yAxisColumn: string | null;
  aggregation: 'sum' | 'count' | 'average';
}

// Chart Data Point
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Dashboard State
export interface DashboardState {
  kpiData: KpiData;
  kpiConfig: KpiConfig;
  charts: ChartConfig[];
  isLoading: boolean;
}

// Column Mapping for KPIs - auto-detection hints
export const KPI_COLUMN_HINTS = {
  sales: ['total', 'amount', 'revenue', 'sales', 'price', 'value', 'income'],
  quantity: ['quantity', 'qty', 'count', 'units', 'items'],
  customer: ['customer', 'client', 'buyer', 'name', 'customer_name'],
  date: ['date', 'time', 'timestamp', 'created', 'order_date'],
  cost: ['cost', 'purchase', 'expense', 'buy', 'cogs', 'purchase_price', 'unit_cost', 'buying'],
} as const;
