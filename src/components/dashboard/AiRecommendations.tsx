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
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LucideIcon,
  BrainCircuit,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Recommendation,
  RecommendationType,
  RecommendationPriority,
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
        group relative overflow-hidden rounded-2xl border border-white/40 dark:border-white/5
        bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl
        ${expanded ? 'ring-2 ring-indigo-500/50 shadow-2xl scale-[1.01]' : 'hover:shadow-xl hover:-translate-y-1'}
        transition-all duration-500 ease-out cursor-pointer
        animate-in fade-in slide-in-from-bottom-4
      `}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 bg-linear-to-br ${gradient} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}
      />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className={`
              w-12 h-12 rounded-2xl bg-linear-to-br ${gradient}
              flex items-center justify-center text-white shadow-lg
              group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500
              ${expanded ? 'scale-110 rotate-3' : ''}
            `}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge
                variant="secondary"
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${pConfig.bg} ${pConfig.color} border-0 font-bold rounded-md`}
              >
                <PriorityIcon className="h-3 w-3 mr-1" />
                {getTranslatedPriority()}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-bold rounded-md"
              >
                {getTranslatedType()}
              </Badge>
            </div>

            <h4
              className={`font-bold text-base text-slate-900 dark:text-slate-100 leading-snug transition-colors ${expanded ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}
            >
              {rec.title}
            </h4>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-125 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}
            >
              <div className="space-y-4">
                {/* Consolidated Info Area */}
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-800/30">
                  <div className="flex flex-col gap-3">
                    {rec.metric && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-500 shrink-0">
                          {language === 'mm' ? 'အချက်အလက်:' : 'Metric:'}
                        </span>
                        <span
                          className={`font-bold text-sm bg-linear-to-r ${gradient} bg-clip-text text-transparent`}
                        >
                          {rec.metric}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 shrink-0 mt-1">
                          {language === 'mm' ? 'သုံးသပ်ချက်:' : 'Insight:'}
                        </span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {rec.insight}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 shrink-0 mt-1">
                          {language === 'mm' ? 'အကြံပြုချက်:' : 'Action:'}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 group-hover:text-indigo-500 transition-all">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
    <Card className="relative overflow-hidden border-0 bg-transparent shadow-none">
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50/20 via-white/40 to-purple-50/20 dark:from-indigo-950/10 dark:via-slate-900/40 dark:to-purple-950/10 pointer-events-none rounded-3xl border border-white/40 dark:border-white/5" />
      <CardHeader className="relative px-0 pt-0 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black bg-linear-to-r from-indigo-700 via-violet-700 to-purple-700 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                {t('recommendations.title')}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
              >
                <BrainCircuit className="h-3 w-3 mr-1" />
                Powered by Genius AI
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm">
            {hasDataChanged && !isLoading && (
              <button
                onClick={handleRefreshForBusiness}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 animate-in fade-in slide-in-from-right-4"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                {language === 'mm'
                  ? 'သင့်လုပ်ငန်းအတွက် အကြံပြုချက်ကြည့်ပါ'
                  : 'View recommendation for your business'}
              </button>
            )}
            {highCount > 0 && (
              <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-900/50">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {highCount} {t('recommendations.highPriority')}
                </span>
              </div>
            )}
            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-900/50">
              <Lightbulb className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {recommendations.length} {t('recommendations.insights')}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative px-0 space-y-4">
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
              <Button
                onClick={() => generate(language)}
                className="bg-indigo-600 hover:bg-indigo-700 size-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'mm' ? 'ပြန်လည်ကြိုးစားပါ' : 'Retry'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedRecs.map((rec, index) => (
              <RecommendationCard key={rec.id} rec={rec} index={index} />
            ))}
          </div>
        )}
        {!isLoading && !error && filteredRecs.length > 4 && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(!showAll)}
              className="rounded-2xl px-10 border-2 border-indigo-100 dark:border-indigo-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold tracking-tight"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-5 w-5 mr-2" />
                  {t('recommendations.showLess')}
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  {t('recommendations.showAll')} ({filteredRecs.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
