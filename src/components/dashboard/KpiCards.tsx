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
  priority?: 'primary' | 'secondary'; // Primary cards are larger and span 2 columns
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
        priority: 'primary',
      },
      {
        key: 'totalOrders',
        titleKey: 'dashboard.kpi.totalOrders',
        icon: <ShoppingCart className="h-5 w-5" />,
        format: 'number',
        gradient: 'from-blue-500 to-indigo-600',
        iconBg: 'bg-blue-500/20 text-blue-600',
        priority: 'primary',
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
        priority: 'primary',
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

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
      {visibleKpis.map(config => {
        const isPrimary = config.priority === 'primary';
        return (
          <Card
            key={config.key}
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
              'border-0 bg-linear-to-r',
              config.gradient,
              // Primary cards span 2 columns and are taller
              isPrimary ? 'col-span-2 min-h-36 md:min-h-40' : 'col-span-1 min-h-28'
            )}
          >
            <CardHeader
              className={cn(
                'flex flex-row items-center justify-between px-4',
                isPrimary ? 'pb-2 pt-4' : 'pb-1 pt-3'
              )}
            >
              <CardTitle
                className={cn(
                  'font-medium text-white/90 leading-tight',
                  isPrimary ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm'
                )}
              >
                {t(config.titleKey)}
              </CardTitle>
              <div
                className={cn(
                  'rounded-full shrink-0 bg-white/20 text-white',
                  isPrimary ? 'p-2 sm:p-3' : 'p-1.5 sm:p-2'
                )}
              >
                {isPrimary ? (
                  <div className="[&>svg]:h-6 [&>svg]:w-6 sm:[&>svg]:h-7 sm:[&>svg]:w-7">
                    {config.icon}
                  </div>
                ) : (
                  config.icon
                )}
              </div>
            </CardHeader>
            <CardContent className={cn('px-4', isPrimary ? 'pt-2 pb-5' : 'pt-1 pb-4')}>
              {isLoading ? (
                <div
                  className={cn(
                    'bg-white/30 rounded animate-pulse',
                    isPrimary ? 'h-10 w-32' : 'h-8 w-24'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'font-bold text-white truncate',
                    isPrimary
                      ? 'text-2xl sm:text-3xl md:text-4xl'
                      : 'text-lg sm:text-xl lg:text-2xl'
                  )}
                >
                  {config.key === 'totalProfit' && kpiData.totalProfit < 0 && '-'}
                  {formatNumber(
                    Math.abs(kpiData[config.key]),
                    config.format === 'percent' ? 'decimal' : config.format
                  )}
                  {config.format === 'currency' && (
                    <span
                      className={cn(
                        'font-semibold ml-1',
                        isPrimary ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base'
                      )}
                    >
                      Ks
                    </span>
                  )}
                  {config.suffix}
                </div>
              )}
            </CardContent>
            {/* Decorative element */}
            <div
              className={cn(
                'absolute rounded-full bg-white/10',
                isPrimary
                  ? '-right-6 -bottom-6 h-28 w-28 md:h-32 md:w-32'
                  : '-right-4 -bottom-4 h-20 w-20'
              )}
            />
          </Card>
        );
      })}
    </div>
  );
}
