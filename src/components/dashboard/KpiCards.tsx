'use client';

import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  CreditCard,
  Banknote,
  Percent,
  LucideIcon,
} from 'lucide-react';
import { KpiData } from '@/types/dashboard';
import { formatNumber } from '@/lib/kpi-calculator';
import { useLanguage } from '@/context/LanguageContext';

interface KpiCardsProps {
  kpiData: KpiData;
}

interface CardConfig {
  labelKey: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  accentColor: string;
  formatType: 'currency' | 'number' | 'decimal';
  decorShape: 'circle' | 'rings' | 'dots' | 'arc';
}

/** Lightweight decorative shape in card bottom-right corner */
function DecorShape({ type, color }: { type: CardConfig['decorShape']; color: string }) {
  const cls = 'absolute bottom-0 right-0 pointer-events-none opacity-[0.12]';
  if (type === 'circle')
    return (
      <svg className={cls} width="90" height="90" viewBox="0 0 90 90">
        <circle cx="70" cy="70" r="55" fill={color} />
      </svg>
    );
  if (type === 'rings')
    return (
      <svg className={cls} width="90" height="90" viewBox="0 0 90 90">
        <circle cx="70" cy="70" r="50" fill="none" stroke={color} strokeWidth="14" />
        <circle cx="70" cy="70" r="30" fill="none" stroke={color} strokeWidth="8" />
      </svg>
    );
  if (type === 'dots')
    return (
      <svg className={cls} width="90" height="90" viewBox="0 0 90 90">
        {[0, 1, 2, 3].map(r =>
          [0, 1, 2, 3].map(c => (
            <circle key={`${r}-${c}`} cx={55 + c * 12} cy={55 + r * 12} r="3" fill={color} />
          ))
        )}
      </svg>
    );
  if (type === 'arc')
    return (
      <svg className={cls} width="90" height="90" viewBox="0 0 90 90">
        <path d="M 0 90 Q 45 30 90 0" fill="none" stroke={color} strokeWidth="14" />
        <path d="M 0 90 Q 55 45 90 15" fill="none" stroke={color} strokeWidth="8" />
      </svg>
    );
  return null;
}

export function KpiCards({ kpiData }: KpiCardsProps) {
  const { t } = useLanguage();

  const cards: CardConfig[] = [
    {
      labelKey: 'dashboard.kpi.totalSales',
      value: kpiData.totalSales,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-400/30',
      accentColor: '#34d399',
      formatType: 'currency',
      decorShape: 'circle',
    },
    {
      labelKey: 'dashboard.kpi.totalOrders',
      value: kpiData.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-400/30',
      accentColor: '#60a5fa',
      formatType: 'number',
      decorShape: 'rings',
    },
    {
      labelKey: 'dashboard.kpi.totalQuantity',
      value: kpiData.totalQuantity,
      icon: Package,
      gradient: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-300/30',
      accentColor: '#fbbf24',
      formatType: 'number',
      decorShape: 'dots',
    },
    {
      labelKey: 'dashboard.kpi.avgOrderValue',
      value: kpiData.averageOrderValue,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-400/30',
      accentColor: '#a78bfa',
      formatType: 'currency',
      decorShape: 'arc',
    },
    {
      labelKey: 'dashboard.kpi.uniqueCustomers',
      value: kpiData.uniqueCustomers,
      icon: Users,
      gradient: 'from-rose-400 to-pink-600',
      iconBg: 'bg-rose-300/30',
      accentColor: '#fb7185',
      formatType: 'number',
      decorShape: 'circle',
    },
    {
      labelKey: 'dashboard.kpi.totalCost',
      value: kpiData.totalCost,
      icon: CreditCard,
      gradient: 'from-sky-400 to-cyan-600',
      iconBg: 'bg-sky-300/30',
      accentColor: '#38bdf8',
      formatType: 'currency',
      decorShape: 'rings',
    },
    {
      labelKey: 'dashboard.kpi.totalProfit',
      value: kpiData.totalProfit,
      icon: Banknote,
      gradient: 'from-green-400 to-emerald-600',
      iconBg: 'bg-green-300/30',
      accentColor: '#4ade80',
      formatType: 'currency',
      decorShape: 'dots',
    },
    {
      labelKey: 'dashboard.kpi.profitMargin',
      value: kpiData.profitMargin,
      icon: Percent,
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-300/30',
      accentColor: '#fb923c',
      formatType: 'decimal',
      decorShape: 'arc',
    },
  ];

  const visibleCards = cards.filter(card => card.value > 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {visibleCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`
                group relative overflow-hidden rounded-xl p-3 sm:p-4
                bg-gradient-to-br ${card.gradient}
                shadow-md hover:shadow-lg
                hover:-translate-y-0.5
                transition-all duration-200 ease-out
                cursor-default min-h-[100px] sm:min-h-[110px] flex flex-col justify-between
              `}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Decorative background shape */}
              <DecorShape type={card.decorShape} color="white" />

              {/* Top row: icon + optional label */}
              <div className="relative z-10 flex items-start justify-between">
                <div
                  className={`
                    ${card.iconBg} backdrop-blur-sm
                    w-9 h-9 sm:w-10 sm:h-10
                    rounded-lg flex items-center justify-center
                    border border-white/20
                    group-hover:scale-105 transition-transform duration-200
                  `}
                >
                  <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white drop-shadow-sm" strokeWidth={2} />
                </div>
                {/* Subtle live badge */}
                <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-white/60 bg-white/10 rounded-full px-1.5 py-0.5 border border-white/15">
                  Live
                </span>
              </div>

              {/* Bottom: value + label */}
              <div className="relative z-10 mt-2">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-white tracking-tight leading-none">
                    {formatNumber(card.value, card.formatType)}
                  </span>
                  {card.formatType === 'currency' && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white/70 leading-none">MMK</span>
                  )}
                  {card.formatType === 'decimal' && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white/70 leading-none">%</span>
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] font-semibold text-white/65 uppercase tracking-widest mt-0.5 truncate">
                  {t(card.labelKey)}
                </p>
              </div>

              {/* Hover shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
