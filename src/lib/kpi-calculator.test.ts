import { detectKpiColumns, calculateKpis, formatNumber, aggregateByColumn } from './kpi-calculator';
import { ColumnInfo } from '@/types/csv';
import { KpiConfig } from '@/types/dashboard';

describe('KPI Calculator Utilities', () => {
  describe('detectKpiColumns', () => {
    it('should map columns to KPI config based on hints and types', () => {
      const mockColumns: ColumnInfo[] = [
        { name: 'Order Date', type: 'date', sampleValues: [] },
        { name: 'Revenue', type: 'number', sampleValues: [] },
        { name: 'Quantity Purchased', type: 'number', sampleValues: [] },
        { name: 'Cost of Goods', type: 'number', sampleValues: [] },
        { name: 'Customer Email', type: 'text', sampleValues: [] },
      ];

      const config = detectKpiColumns(mockColumns);

      expect(config.salesColumn).toBe('Revenue');
      expect(config.quantityColumn).toBe('Quantity Purchased');
      expect(config.costColumn).toBe('Cost of Goods');
      expect(config.dateColumn).toBe('Order Date');
      expect(config.customerColumn).toBe('Customer Email');
    });

    it('should fall back to the first non-phone, non-ID numeric column for sales', () => {
      const mockColumns: ColumnInfo[] = [
        { name: 'id', type: 'number', sampleValues: [] },
        { name: 'contact_number', type: 'number', sampleValues: [] },
        { name: 'Sales Metric', type: 'number', sampleValues: [] },
      ];

      const config = detectKpiColumns(mockColumns);

      expect(config.salesColumn).toBe('Sales Metric');
    });

    it('should return null config mappings when no match is found', () => {
      const mockColumns: ColumnInfo[] = [
        { name: 'Unrelated Column', type: 'text', sampleValues: [] },
      ];

      const config = detectKpiColumns(mockColumns);

      expect(config.salesColumn).toBeNull();
      expect(config.quantityColumn).toBeNull();
      expect(config.costColumn).toBeNull();
      expect(config.dateColumn).toBeNull();
      expect(config.customerColumn).toBeNull();
    });
  });

  describe('calculateKpis', () => {
    const config: KpiConfig = {
      salesColumn: 'sales',
      quantityColumn: 'quantity',
      customerColumn: 'customer',
      dateColumn: 'date',
      costColumn: 'cost',
    };

    it('should calculate correct metrics for typical data arrays', () => {
      const mockData = [
        { sales: 100, quantity: 2, customer: 'Alice', cost: 60 },
        { sales: 150, quantity: 3, customer: 'Bob', cost: 90 },
        { sales: 200, quantity: 4, customer: 'Alice', cost: 130 },
      ];

      const metrics = calculateKpis(mockData, config);

      expect(metrics.totalSales).toBe(450);
      expect(metrics.totalOrders).toBe(3);
      expect(metrics.totalQuantity).toBe(9);
      expect(metrics.averageOrderValue).toBe(150); // 450 / 3
      expect(metrics.uniqueCustomers).toBe(2); // Alice and Bob
      expect(metrics.totalCost).toBe(280);
      expect(metrics.totalProfit).toBe(170); // 450 - 280
      expect(metrics.profitMargin).toBeCloseTo(37.777, 2); // (170 / 450) * 100
    });

    it('should handle empty data lists gracefully', () => {
      const metrics = calculateKpis([], config);

      expect(metrics.totalSales).toBe(0);
      expect(metrics.totalOrders).toBe(0);
      expect(metrics.totalQuantity).toBe(0);
      expect(metrics.averageOrderValue).toBe(0);
      expect(metrics.uniqueCustomers).toBe(0);
      expect(metrics.totalProfit).toBe(0);
      expect(metrics.profitMargin).toBe(0);
    });

    it('should prevent NaN calculations when sales value is zero', () => {
      const mockData = [
        { sales: 0, quantity: 0, customer: 'Alice', cost: 50 },
      ];

      const metrics = calculateKpis(mockData, config);

      expect(metrics.averageOrderValue).toBe(0);
      expect(metrics.profitMargin).toBe(0);
      expect(metrics.totalProfit).toBe(-50);
    });
  });

  describe('formatNumber', () => {
    it('should format values with thousands separators', () => {
      expect(formatNumber(1250000)).toBe('1,250,000');
    });

    it('should format decimals with double digits', () => {
      expect(formatNumber(125.456, 'decimal')).toBe('125.46');
      expect(formatNumber(125, 'decimal')).toBe('125.00');
    });

    it('should format currency with proper decimals matching config rules', () => {
      expect(formatNumber(1250.7, 'currency')).toBe('1,250.7');
      expect(formatNumber(1250, 'currency')).toBe('1,250');
    });
  });

  describe('aggregateByColumn', () => {
    const mockData = [
      { category: 'A', value: 10 },
      { category: 'B', value: 20 },
      { category: 'A', value: 15 },
    ];

    it('should aggregate group categories by sum and sort descending', () => {
      const result = aggregateByColumn(mockData, 'category', 'value', 'sum');

      expect(result).toEqual([
        { name: 'A', value: 25 },
        { name: 'B', value: 20 },
      ]);
    });

    it('should aggregate group categories by count and sort descending', () => {
      const result = aggregateByColumn(mockData, 'category', 'value', 'count');

      expect(result).toEqual([
        { name: 'A', value: 2 },
        { name: 'B', value: 1 },
      ]);
    });

    it('should aggregate group categories by average and sort descending', () => {
      const result = aggregateByColumn(mockData, 'category', 'value', 'average');

      expect(result).toEqual([
        { name: 'B', value: 20 }, // Avg of B = 20
        { name: 'A', value: 12.5 }, // Avg of A = (10 + 15) / 2 = 12.5
      ]);
    });
  });
});
