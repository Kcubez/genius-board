import { ColumnInfo } from '@/types/csv';

// ─── Types ────────────────────────────────────────────────────────────
export type RecommendationType =
  | 'regional'
  | 'product'
  | 'time'
  | 'customer'
  | 'payment'
  | 'general';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  insight: string;
  icon: string;
  metric?: string;
}

// ─── Column detection helpers ──────────────────────────────────────────
const REGION_HINTS = [
  'region',
  'city',
  'location',
  'area',
  'state',
  'province',
  'township',
  'zone',
  'branch',
  'store',
  'outlet',
  'market',
];
const PRODUCT_HINTS = ['product', 'item', 'goods', 'merchandise', 'sku'];
const CATEGORY_HINTS = ['category', 'type', 'group', 'class', 'segment', 'department'];
const CUSTOMER_HINTS = ['customer', 'client', 'buyer', 'name', 'customer_name'];
const PAYMENT_HINTS = ['payment', 'pay', 'method', 'payment_method'];
const DATE_HINTS = ['date', 'time', 'timestamp', 'created', 'order_date'];
const SALES_HINTS = ['total', 'amount', 'revenue', 'sales', 'price', 'value', 'income'];
const QUANTITY_HINTS = ['quantity', 'qty', 'count', 'units'];
const SALESPERSON_HINTS = ['salesperson', 'seller', 'agent', 'staff', 'employee', 'rep'];

function findColumnByHints(
  columns: ColumnInfo[],
  hints: string[],
  type?: ColumnInfo['type']
): string | null {
  for (const hint of hints) {
    const match = columns.find(
      col => col.name.toLowerCase().includes(hint) && (!type || col.type === type)
    );
    if (match) return match.name;
  }
  return null;
}

// ─── Group and sum helper ──────────────────────────────────────────────
function groupAndSum(
  data: Record<string, string | number | Date | null>[],
  groupCol: string,
  valueCol: string
): Map<string, { total: number; count: number }> {
  const groups = new Map<string, { total: number; count: number }>();

  for (const row of data) {
    const key = String(row[groupCol] ?? 'Unknown');
    const val = typeof row[valueCol] === 'number' ? row[valueCol] : 0;
    const existing = groups.get(key) || { total: 0, count: 0 };
    existing.total += val;
    existing.count += 1;
    groups.set(key, existing);
  }

  return groups;
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

// ─── Build dataset summary for Gemini ──────────────────────────────────
export function buildDataSummary(
  data: Record<string, string | number | Date | null>[],
  columns: ColumnInfo[]
): string {
  if (data.length === 0) return '';

  const lines: string[] = [];
  lines.push(`Total rows: ${data.length}`);
  lines.push(`Columns: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}`);
  lines.push('');

  // Detect columns
  const regionCol = findColumnByHints(columns, REGION_HINTS);
  const productCol = findColumnByHints(columns, PRODUCT_HINTS);
  const categoryCol = findColumnByHints(columns, CATEGORY_HINTS);
  const customerCol = findColumnByHints(columns, CUSTOMER_HINTS);
  const paymentCol = findColumnByHints(columns, PAYMENT_HINTS);
  const salesCol =
    findColumnByHints(columns, SALES_HINTS, 'number') ||
    columns.find(c => {
      if (c.type !== 'number') return false;
      const nameLower = c.name.toLowerCase();
      return !['phone', 'contact', 'mobile', 'tel', 'no', 'number', 'id'].some(
        hint => nameLower.includes(hint)
      );
    })?.name ||
    null;
  const quantityCol = findColumnByHints(columns, QUANTITY_HINTS, 'number');
  const dateCol =
    findColumnByHints(columns, DATE_HINTS, 'date') ||
    columns.find(c => c.type === 'date')?.name ||
    null;
  const salespersonCol = findColumnByHints(columns, SALESPERSON_HINTS);

  // Total sales
  const totalSales = salesCol
    ? data.reduce((s, r) => s + (typeof r[salesCol] === 'number' ? (r[salesCol] as number) : 0), 0)
    : 0;

  if (salesCol) {
    lines.push(`### Sales Summary (${salesCol})`);
    lines.push(`Total: ${formatNum(totalSales)} MMK`);
    lines.push(`Average per order: ${formatNum(totalSales / data.length)} MMK`);
    lines.push('');
  }

  // Region breakdown
  if (regionCol && salesCol) {
    const regionData = groupAndSum(data, regionCol, salesCol);
    lines.push(`### By Region (${regionCol})`);
    const sorted = Array.from(regionData.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);
    for (const item of sorted) {
      const pct = totalSales > 0 ? Math.round((item.total / totalSales) * 100) : 0;
      lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${pct}%, ${item.count} orders)`);
    }
    lines.push('');
  }

  // Category breakdown
  const catCol = categoryCol || productCol;
  if (catCol && salesCol) {
    const catData = groupAndSum(data, catCol, salesCol);
    lines.push(`### By ${catCol}`);
    const sorted = Array.from(catData.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);
    for (const item of sorted.slice(0, 10)) {
      const pct = totalSales > 0 ? Math.round((item.total / totalSales) * 100) : 0;
      lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${pct}%, ${item.count} orders)`);
    }
    if (sorted.length > 10) lines.push(`... and ${sorted.length - 10} more`);
    lines.push('');
  }

  // Time breakdown
  if (dateCol && salesCol) {
    const monthData = new Map<string, { total: number; count: number }>();
    for (const row of data) {
      const dateVal = row[dateCol];
      if (!dateVal) continue;
      const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal));
      if (isNaN(d.getTime())) continue;
      const monthKey = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const val = typeof row[salesCol] === 'number' ? (row[salesCol] as number) : 0;
      const existing = monthData.get(monthKey) || { total: 0, count: 0 };
      existing.total += val;
      existing.count += 1;
      monthData.set(monthKey, existing);
    }

    if (monthData.size > 0) {
      lines.push(`### By Month`);
      const sorted = Array.from(monthData.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.total - a.total);
      for (const item of sorted) {
        lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${item.count} orders)`);
      }
      lines.push('');
    }
  }

  // Customer breakdown
  if (customerCol && salesCol) {
    const customerData = groupAndSum(data, customerCol, salesCol);
    if (customerData.size > 0) {
      lines.push(`### Top Customers (${customerCol})`);
      lines.push(`Total unique: ${customerData.size}`);
      const sorted = Array.from(customerData.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.total - a.total);
      for (const item of sorted.slice(0, 5)) {
        lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${item.count} orders)`);
      }
      lines.push('');
    }
  }

  // Payment method breakdown
  if (paymentCol && salesCol) {
    const paymentData = groupAndSum(data, paymentCol, salesCol);
    lines.push(`### By Payment Method (${paymentCol})`);
    const sorted = Array.from(paymentData.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);
    for (const item of sorted) {
      const pct = totalSales > 0 ? Math.round((item.total / totalSales) * 100) : 0;
      lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${pct}%, ${item.count} orders)`);
    }
    lines.push('');
  }

  // Salesperson breakdown
  if (salespersonCol && salesCol) {
    const spData = groupAndSum(data, salespersonCol, salesCol);
    lines.push(`### By Salesperson (${salespersonCol})`);
    const sorted = Array.from(spData.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);
    for (const item of sorted) {
      const pct = totalSales > 0 ? Math.round((item.total / totalSales) * 100) : 0;
      lines.push(`- ${item.name}: ${formatNum(item.total)} MMK (${pct}%, ${item.count} orders)`);
    }
    lines.push('');
  }

  // Quantity stats
  if (quantityCol) {
    const quantities = data
      .map(r => (typeof r[quantityCol] === 'number' ? (r[quantityCol] as number) : 0))
      .filter(v => v > 0);
    if (quantities.length > 0) {
      const avgQty = quantities.reduce((s, v) => s + v, 0) / quantities.length;
      const maxQty = Math.max(...quantities);
      const minQty = Math.min(...quantities);
      lines.push(`### Quantity Stats (${quantityCol})`);
      lines.push(`Average: ${avgQty.toFixed(1)}, Min: ${minQty}, Max: ${maxQty}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
