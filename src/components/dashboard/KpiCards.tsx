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
  glowColor: string;
  formatType: 'currency' | 'number' | 'decimal';
  pattern: 'circles' | 'lines' | 'dots' | 'hexagons' | 'waves' | 'grid' | 'rings' | 'diamonds';
}

// Decorative SVG patterns for each card
function CardPattern({ type }: { type: CardConfig['pattern'] }) {
  const cls = 'absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none';

  switch (type) {
    case 'circles':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <circle cx="160" cy="40" r="60" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="160" cy="40" r="40" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="160" cy="40" r="20" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      );
    case 'lines':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <line x1="120" y1="0" x2="200" y2="80" stroke="white" strokeWidth="0.5" />
          <line x1="140" y1="0" x2="200" y2="60" stroke="white" strokeWidth="0.5" />
          <line x1="160" y1="0" x2="200" y2="40" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="200" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="120" y1="200" x2="200" y2="120" stroke="white" strokeWidth="0.5" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          {[...Array(6)].map((_, i) =>
            [...Array(6)].map((_, j) => (
              <circle key={`${i}-${j}`} cx={120 + i * 16} cy={10 + j * 16} r="1.5" fill="white" />
            ))
          )}
        </svg>
      );
    case 'hexagons':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <path
            d="M160 30 L180 42 L180 66 L160 78 L140 66 L140 42 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
          />
          <path
            d="M180 70 L200 82 L200 106 L180 118 L160 106 L160 82 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M140 70 L160 82 L160 106 L140 118 L120 106 L120 82 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      );
    case 'waves':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <path d="M0 160 Q50 140 100 160 T200 160" fill="none" stroke="white" strokeWidth="0.8" />
          <path d="M0 175 Q50 155 100 175 T200 175" fill="none" stroke="white" strokeWidth="0.5" />
          <path d="M0 190 Q50 170 100 190 T200 190" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      );
    case 'grid':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <rect
            x="130"
            y="10"
            width="30"
            height="30"
            rx="4"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
          />
          <rect
            x="165"
            y="10"
            width="30"
            height="30"
            rx="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="130"
            y="45"
            width="30"
            height="30"
            rx="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="165"
            y="45"
            width="30"
            height="30"
            rx="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      );
    case 'rings':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <circle cx="170" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.8" />
          <circle cx="170" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="130" cy="170" r="25" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg className={cls} viewBox="0 0 200 200">
          <rect
            x="150"
            y="20"
            width="30"
            height="30"
            rx="2"
            transform="rotate(45 165 35)"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
          />
          <rect
            x="170"
            y="50"
            width="20"
            height="20"
            rx="2"
            transform="rotate(45 180 60)"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <rect
            x="130"
            y="50"
            width="15"
            height="15"
            rx="2"
            transform="rotate(45 137.5 57.5)"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      );
  }
}

export function KpiCards({ kpiData }: KpiCardsProps) {
  const { t } = useLanguage();

  const cards: CardConfig[] = [
    {
      labelKey: 'dashboard.kpi.totalSales',
      value: kpiData.totalSales,
      icon: DollarSign,
      gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
      glowColor: 'shadow-emerald-500/25',
      formatType: 'currency',
      pattern: 'circles',
    },
    {
      labelKey: 'dashboard.kpi.totalOrders',
      value: kpiData.totalOrders,
      icon: ShoppingCart,
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      glowColor: 'shadow-blue-500/25',
      formatType: 'number',
      pattern: 'hexagons',
    },
    {
      labelKey: 'dashboard.kpi.totalQuantity',
      value: kpiData.totalQuantity,
      icon: Package,
      gradient: 'from-amber-400 via-amber-500 to-orange-600',
      glowColor: 'shadow-amber-500/25',
      formatType: 'number',
      pattern: 'lines',
    },
    {
      labelKey: 'dashboard.kpi.avgOrderValue',
      value: kpiData.averageOrderValue,
      icon: TrendingUp,
      gradient: 'from-violet-500 via-purple-600 to-purple-700',
      glowColor: 'shadow-violet-500/25',
      formatType: 'currency',
      pattern: 'dots',
    },
    {
      labelKey: 'dashboard.kpi.uniqueCustomers',
      value: kpiData.uniqueCustomers,
      icon: Users,
      gradient: 'from-indigo-500 via-indigo-600 to-blue-700',
      glowColor: 'shadow-indigo-500/25',
      formatType: 'number',
      pattern: 'rings',
    },
    {
      labelKey: 'dashboard.kpi.totalCost',
      value: kpiData.totalCost,
      icon: CreditCard,
      gradient: 'from-rose-400 via-pink-500 to-rose-600',
      glowColor: 'shadow-rose-500/25',
      formatType: 'currency',
      pattern: 'waves',
    },
    {
      labelKey: 'dashboard.kpi.totalProfit',
      value: kpiData.totalProfit,
      icon: Banknote,
      gradient: 'from-cyan-400 via-cyan-500 to-teal-600',
      glowColor: 'shadow-cyan-500/25',
      formatType: 'currency',
      pattern: 'grid',
    },
    {
      labelKey: 'dashboard.kpi.profitMargin',
      value: kpiData.profitMargin,
      icon: Percent,
      gradient: 'from-orange-500 via-red-500 to-rose-600',
      glowColor: 'shadow-orange-500/25',
      formatType: 'decimal',
      pattern: 'diamonds',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {cards
        .filter(card => card.value > 0)
        .map((card, index) => {
          const Icon = card.icon;
          const isPriority =
            card.labelKey.includes('totalSales') || card.labelKey.includes('totalProfit');

          return (
            <div
              key={index}
              className={`
                group relative overflow-hidden rounded-3xl p-4 sm:p-6
                bg-linear-to-br ${card.gradient}
                shadow-xl ${card.glowColor}
                hover:shadow-2xl hover:-translate-y-1.5
                transition-all duration-500 ease-out
                cursor-default h-full flex flex-col justify-between
                ${isPriority ? 'col-span-2 md:col-span-2 lg:col-span-3 min-h-40 sm:min-h-50' : 'col-span-1 md:col-span-1 lg:col-span-1 min-h-35'}
              `}
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Decorative Pattern */}
              <CardPattern type={card.pattern} />

              <div className="relative z-10 flex flex-col h-full gap-4">
                {/* Header: Icon & Top Badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`
                    rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 
                    group-hover:bg-white/30 group-hover:scale-110 transition-all duration-500
                    ${isPriority ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-9 h-9 sm:w-10 sm:h-10'}
                  `}
                  >
                    <Icon
                      className={`${isPriority ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-4.5 w-4.5 sm:h-5 sm:w-5'} text-white`}
                      strokeWidth={isPriority ? 2 : 1.5}
                    />
                  </div>
                  {isPriority && (
                    <div className="hidden sm:block px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black text-white/90 uppercase tracking-widest">
                      Key Metric
                    </div>
                  )}
                </div>

                {/* Value & Label */}
                <div className="mt-auto space-y-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <h3
                      className={`font-black text-white tracking-tight leading-none ${isPriority ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-lg sm:text-2xl'}`}
                    >
                      {formatNumber(card.value, card.formatType)}
                    </h3>
                    {card.formatType === 'currency' && (
                      <span
                        className={`font-bold text-white/80 ${isPriority ? 'text-base sm:text-lg' : 'text-[10px]'}`}
                      >
                        MMK
                      </span>
                    )}
                    {card.formatType === 'decimal' && (
                      <span
                        className={`font-bold text-white/80 ${isPriority ? 'text-base sm:text-lg' : 'text-[10px]'}`}
                      >
                        %
                      </span>
                    )}
                  </div>
                  <p
                    className={`font-bold text-white/60 uppercase tracking-widest truncate ${isPriority ? 'text-xs sm:text-sm' : 'text-[9px] sm:text-[10px]'}`}
                  >
                    {t(card.labelKey)}
                  </p>
                </div>
              </div>

              {/* Enhanced Hover glow effect */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
          );
        })}
    </div>
  );
}
