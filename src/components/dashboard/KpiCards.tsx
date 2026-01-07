'use client';

import React, { useMemo } from 'react';
import { DollarSign, ShoppingCart, Package, TrendingUp, Users } from 'lucide-react';
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
  format: 'currency' | 'number' | 'decimal';
  gradient: string;
  iconBg: string;
}

export function KpiCards({ kpiData, isLoading = false }: KpiCardsProps) {
  const { t } = useLanguage();

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
    ],
    []
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
      {kpiConfigs.map(config => (
        <Card
          key={config.key}
          className={cn(
            'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
            'border-0 bg-gradient-to-br',
            config.gradient
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              {t(config.titleKey)}
            </CardTitle>
            <div className={cn('p-2 rounded-full', 'bg-white/20 text-white')}>{config.icon}</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-white/30 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {formatNumber(kpiData[config.key], config.format)}
                {config.format === 'currency' && ' Ks'}
              </div>
            )}
          </CardContent>
          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
        </Card>
      ))}
    </div>
  );
}
