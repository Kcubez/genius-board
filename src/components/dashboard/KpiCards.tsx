'use client';

import React, { useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  PiggyBank,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiData } from '@/types/dashboard';
import { formatNumber } from '@/lib/kpi-calculator';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
  kpiData: KpiData;
  isLoading?: boolean;
}

interface KpiCardConfig {
  key: keyof KpiData;
  titleKey: string;
  icon: React.ReactNode;
  format: 'currency' | 'number' | 'decimal' | 'percent';
  gradient: string;
  iconBg: string;
  suffix?: string;
}

export function KpiCards({ kpiData, isLoading = false }: KpiCardsProps) {
  const { t } = useLanguage();

  // Determine if profit is positive or negative for dynamic styling
  const isProfitable = kpiData.totalProfit >= 0;

  const kpiConfigs: KpiCardConfig[] = useMemo(
    () => [
      {
        key: 'totalSales',
        titleKey: 'dashboard.kpi.totalSales',
        icon: <DollarSign className="h-5 w-5" />,
        format: 'currency',
        gradient: 'from-emerald-500 to-teal-600',
        iconBg: 'bg-emerald-500/20 text-emerald-600',
      },
      {
        key: 'totalOrders',
        titleKey: 'dashboard.kpi.totalOrders',
        icon: <ShoppingCart className="h-5 w-5" />,
        format: 'number',
        gradient: 'from-blue-500 to-indigo-600',
        iconBg: 'bg-blue-500/20 text-blue-600',
      },
      {
        key: 'totalQuantity',
        titleKey: 'dashboard.kpi.totalQuantity',
        icon: <Package className="h-5 w-5" />,
        format: 'number',
        gradient: 'from-purple-500 to-pink-600',
        iconBg: 'bg-purple-500/20 text-purple-600',
      },
      {
        key: 'averageOrderValue',
        titleKey: 'dashboard.kpi.avgOrderValue',
        icon: <TrendingUp className="h-5 w-5" />,
        format: 'currency',
        gradient: 'from-orange-500 to-red-600',
        iconBg: 'bg-orange-500/20 text-orange-600',
      },
      {
        key: 'uniqueCustomers',
        titleKey: 'dashboard.kpi.uniqueCustomers',
        icon: <Users className="h-5 w-5" />,
        format: 'number',
        gradient: 'from-cyan-500 to-blue-600',
        iconBg: 'bg-cyan-500/20 text-cyan-600',
      },
      // Profit/Loss KPIs - only shown if cost data exists
      {
        key: 'totalCost',
        titleKey: 'dashboard.kpi.totalCost',
        icon: <Wallet className="h-5 w-5" />,
        format: 'currency',
        gradient: 'from-rose-500 to-red-600',
        iconBg: 'bg-rose-500/20 text-rose-600',
      },
      {
        key: 'totalProfit',
        titleKey: 'dashboard.kpi.totalProfit',
        icon: isProfitable ? (
          <PiggyBank className="h-5 w-5" />
        ) : (
          <TrendingDown className="h-5 w-5" />
        ),
        format: 'currency',
        gradient: isProfitable ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600',
        iconBg: isProfitable ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600',
      },
      {
        key: 'profitMargin',
        titleKey: 'dashboard.kpi.profitMargin',
        icon: <Percent className="h-5 w-5" />,
        format: 'percent',
        gradient: isProfitable ? 'from-teal-500 to-cyan-600' : 'from-orange-500 to-red-600',
        iconBg: isProfitable ? 'bg-teal-500/20 text-teal-600' : 'bg-orange-500/20 text-orange-600',
        suffix: '%',
      },
    ],
    [isProfitable]
  );

  // Filter out KPIs that don't have data
  const visibleKpis = kpiConfigs.filter(config => {
    // Always show these core KPIs
    if (['totalSales', 'totalOrders', 'averageOrderValue'].includes(config.key)) {
      return true;
    }
    // For profit/loss KPIs, show only if we have cost data (totalCost > 0)
    if (['totalCost', 'totalProfit', 'profitMargin'].includes(config.key)) {
      return kpiData.totalCost > 0;
    }
    // Only show other KPIs if they have actual data
    return kpiData[config.key] > 0;
  });

  // Calculate grid columns based on visible KPIs count - max 4 per row for readability
  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2 lg:grid-cols-4';
    // For 5+ cards, use 2 rows: 4 on top, rest below
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={cn('grid gap-3 md:gap-4', getGridCols(visibleKpis.length))}>
      {visibleKpis.map(config => (
        <Card
          key={config.key}
          className={cn(
            'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
            'border-0 bg-linear-to-r min-h-30',
            config.gradient
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-white/90 leading-tight">
              {t(config.titleKey)}
            </CardTitle>
            <div className={cn('p-1.5 sm:p-2 rounded-full shrink-0', 'bg-white/20 text-white')}>
              {config.icon}
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-4 px-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-white/30 rounded animate-pulse" />
            ) : (
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                {config.key === 'totalProfit' && kpiData.totalProfit < 0 && '-'}
                {formatNumber(
                  Math.abs(kpiData[config.key]),
                  config.format === 'percent' ? 'decimal' : config.format
                )}
                {config.format === 'currency' && (
                  <span className="text-sm sm:text-base font-semibold ml-1">Ks</span>
                )}
                {config.suffix}
              </div>
            )}
          </CardContent>
          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
        </Card>
      ))}
    </div>
  );
}
