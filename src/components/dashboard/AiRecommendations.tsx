'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Sparkles,
  MapPin,
  ShoppingBag,
  Clock,
  Users,
  CreditCard,
  Zap,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  LucideIcon,
  BrainCircuit,
  RefreshCw,
} from 'lucide-react';
import {
  Recommendation,
  buildDataSummary,
} from '@/lib/ai-recommendations';
import { ColumnInfo } from '@/types/csv';
import { useLanguage } from '@/context/LanguageContext';

interface AiRecommendationsProps {
  datasetId: string;
  savedRecommendations: Record<string, any> | null;
  data: Record<string, string | number | Date | null>[];
  columns: ColumnInfo[];
  hasDataChanged?: boolean;
  onRecommendationGenerated?: () => void;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  regional: MapPin,
  product: ShoppingBag,
  time: Clock,
  customer: Users,
  payment: CreditCard,
  general: Zap,
};

const TYPE_GRADIENTS: Record<string, string> = {
  regional: 'from-blue-500 to-cyan-500',
  product: 'from-emerald-500 to-teal-500',
  time: 'from-amber-500 to-orange-500',
  customer: 'from-purple-500 to-pink-500',
  payment: 'from-rose-500 to-red-500',
  general: 'from-indigo-500 to-violet-500',
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
  high: {
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: AlertTriangle,
  },
  medium: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: TrendingUp,
  },
  low: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: CheckCircle2,
  },
};

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const typeKey = (rec.type || 'general').toLowerCase();
  const safeType = TYPE_ICONS[typeKey] ? typeKey : 'general';
  const Icon = TYPE_ICONS[safeType];
  const gradient = TYPE_GRADIENTS[safeType];

  const priorityKey = (rec.priority || 'medium').toLowerCase();
  const safePriority = PRIORITY_CONFIG[priorityKey] ? priorityKey : 'medium';
  const pConfig = PRIORITY_CONFIG[safePriority];
  const PriorityIcon = pConfig.icon;

  const getTranslatedType = () => {
    const translation = t(`recommendations.types.${safeType}`);
    return translation.includes('.')
      ? safeType.charAt(0).toUpperCase() + safeType.slice(1)
      : translation;
  };

  const getTranslatedPriority = () => {
    const translation = t(`recommendations.priorities.${safePriority}`);
    return translation.includes('.')
      ? safePriority.charAt(0).toUpperCase() + safePriority.slice(1)
      : translation;
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`
        group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/40
        bg-white dark:bg-slate-900
        ${expanded ? 'ring-2 ring-indigo-500/30 shadow-xl' : 'hover:shadow-lg hover:border-indigo-200/80 dark:hover:border-indigo-700/50'}
        transition-all duration-300 ease-out cursor-pointer
        animate-in fade-in slide-in-from-bottom-4
      `}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`
            w-11 h-11 rounded-xl bg-linear-to-br ${gradient}
            flex items-center justify-center text-white shadow-md flex-shrink-0
            transition-transform duration-300
            ${expanded ? 'scale-105' : 'group-hover:scale-105'}
          `}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${pConfig.bg} ${pConfig.color}`}
              >
                <PriorityIcon className="h-3 w-3" />
                {getTranslatedPriority()}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {getTranslatedType()}
              </span>
            </div>

            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
              {rec.title}
            </h4>

            {rec.metric && (
              <p className={`mt-1 text-sm font-bold bg-linear-to-r ${gradient} bg-clip-text text-transparent`}>
                {rec.metric}
              </p>
            )}
          </div>

          <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:text-indigo-500 transition-all">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800' : 'max-h-0 opacity-0 mt-0 pt-0'
          }`}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="text-[10px] font-semibold uppercase text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5">
                {language === 'mm' ? 'သုံးသပ်ချက်' : 'Insight'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {rec.insight}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-semibold uppercase text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">
                {language === 'mm' ? 'အကြံပြုချက်' : 'Action'}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {rec.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ language }: { language: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/20 backdrop-blur-xl relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500/10 blur-[80px] rounded-full animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 animate-bounce transition-all duration-1000">
          <BrainCircuit className="h-10 w-10 text-white animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          {language === 'mm'
            ? 'Genius AI က အချက်အလက်များကို သုံးသပ်နေပါသည်...'
            : 'Genius AI is analyzing your data...'}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {language === 'mm'
            ? 'သင့်လုပ်ငန်းအတွက် အကောင်းဆုံးအကြံပြုချက်များကို ဖန်တီးပေးနေပါသည်။ ခေတ္တစောင့်ဆိုင်းပေးပါ။'
            : 'Crafting the best business growth strategies based on your specific report. Please wait a moment.'}
        </p>

        <div className="mt-8 flex gap-1 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export function AiRecommendations({
  datasetId,
  savedRecommendations,
  data,
  columns,
  hasDataChanged = false,
  onRecommendationGenerated,
}: AiRecommendationsProps) {
  const { t, language } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [fullRecommendations, setFullRecommendations] = useState<Record<
    string,
    Recommendation[]
  > | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationInProgress = useRef<string | null>(null);

  // Initialize from saved recommendations
  useEffect(() => {
    if (savedRecommendations) {
      setFullRecommendations(savedRecommendations as Record<string, Recommendation[]>);
    }
  }, [savedRecommendations]);

  const generate = useCallback(
    async (targetLang: string) => {
      if (generationInProgress.current || data.length < 3) return;
      generationInProgress.current = 'generating';
      setIsLoading(true);
      setError(null);

      try {
        // Add a small 1s delay to stagger DB requests and avoid MaxClients error on Vercel
        await new Promise(r => setTimeout(r, 1000));

        const dataSummary = buildDataSummary(data, columns);
        const response = await fetch('/api/datasets/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataSummary, datasetId }),
        });
        const result = await response.json();
        if (result.success && result.recommendations) {
          // Store both EN and MM in local state
          setFullRecommendations(result.recommendations);
        } else {
          setError(result.error || 'Failed to generate recommendations');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please check your connection.');
      } finally {
        setIsLoading(false);
        generationInProgress.current = null;
      }
    },
    [data, columns, datasetId]
  );

  // Triggered by the "View recommendation for your business" button
  const handleRefreshForBusiness = useCallback(async () => {
    // Clear existing recommendations so fresh ones are generated
    setFullRecommendations(null);
    await generate(language);
    if (onRecommendationGenerated) onRecommendationGenerated();
  }, [generate, language, onRecommendationGenerated]);

  // Synchronize displayed recommendations whenever state or toggle language changes
  useEffect(() => {
    if (fullRecommendations && fullRecommendations[language]) {
      setRecommendations(fullRecommendations[language]);
      setIsLoading(false);
      setError(null);
    } else if (!isLoading && !fullRecommendations && data.length >= 3) {
      generate(language);
    }
  }, [language, fullRecommendations, data.length, generate, isLoading]);

  const availableTypes = useMemo(() => {
    const types = new Set(
      recommendations.map(r =>
        TYPE_ICONS[r.type.toLowerCase()] ? r.type.toLowerCase() : 'general'
      )
    );
    return Array.from(types);
  }, [recommendations]);

  const filteredRecs = useMemo(() => {
    if (activeFilter === 'all') return recommendations;
    return recommendations.filter(
      r => (TYPE_ICONS[r.type.toLowerCase()] ? r.type.toLowerCase() : 'general') === activeFilter
    );
  }, [recommendations, activeFilter]);

  const displayedRecs = showAll ? filteredRecs : filteredRecs.slice(0, 4);
  const highCount = recommendations.filter(r => r.priority === 'high').length;
  if (data.length < 3 && !recommendations.length && !isLoading && !error) return null;

  return (
    <div className="dash-card overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-violet-100/60 dark:border-violet-900/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('recommendations.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {recommendations.length} {language === 'mm' ? 'အကြံပြုချက်များ' : `${recommendations.length === 1 ? 'insight' : 'insights'}`}
                {highCount > 0 && (
                  <span className="ml-2 text-rose-500 font-medium">
                    • {highCount} {language === 'mm' ? 'အရေးကြီး' : 'high priority'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasDataChanged && !isLoading && (
              <button
                onClick={handleRefreshForBusiness}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-xs font-medium shadow-md shadow-indigo-500/20 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {language === 'mm' ? 'အသစ်' : 'Refresh'}
              </button>
            )}
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
              <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">AI</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        {!isLoading && !error && availableTypes.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {language === 'mm' ? 'အားလုံး' : 'All'}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeFilter === 'all' ? 'bg-indigo-400/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {recommendations.length}
              </span>
            </button>
            {availableTypes.map(type => {
              const Icon = TYPE_ICONS[type] || Zap;
              const count = recommendations.filter(r => r.type.toLowerCase() === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeFilter === type
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(`recommendations.types.${type}`)}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeFilter === type ? 'bg-indigo-400/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {isLoading ? (
          <LoadingSkeleton language={language} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800/50">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 text-center max-w-md">
              {error}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => generate(language)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                {language === 'mm' ? 'ပြန်လည်ကြိုးစားပါ' : 'Retry'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {displayedRecs.map((rec, index) => (
              <RecommendationCard key={rec.id} rec={rec} index={index} />
            ))}
          </div>
        )}
        {!isLoading && !error && filteredRecs.length > 4 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('recommendations.showLess')}
                </>
              ) : (
                <>
                  <span>{t('recommendations.showAll')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    {filteredRecs.length - 4}+
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
