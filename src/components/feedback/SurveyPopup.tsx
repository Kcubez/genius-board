'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '../ui/textarea';

export function SurveyPopup() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if user has already answered the survey
  useEffect(() => {
    if (authLoading || !user || hasChecked) return;

    const localKey = `survey_answered_${user.id}`;
    const alreadyAnswered = localStorage.getItem(localKey);

    if (alreadyAnswered) {
      setHasChecked(true);
      return;
    }

    // Check from DB if user already submitted
    const checkSurvey = async () => {
      try {
        const res = await fetch('/api/feedback?check=true');
        const data = await res.json();

        if (data.success && data.hasAnswered) {
          localStorage.setItem(localKey, 'true');
        } else {
          // Show popup after a short delay
          setTimeout(() => setIsOpen(true), 1500);
        }
      } catch {
        // If check fails, show it anyway
        setTimeout(() => setIsOpen(true), 1500);
      }
      setHasChecked(true);
    };

    checkSurvey();
  }, [user, authLoading, hasChecked]);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'survey',
          message: answer.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        if (user) {
          localStorage.setItem(`survey_answered_${user.id}`, 'true');
        }
        // Auto close after showing success
        setTimeout(() => setIsOpen(false), 2500);
      }
    } catch (error) {
      console.error('Survey submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    if (user) {
      // Don't mark as answered - will show again next session
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleSkip}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'relative w-full max-w-md pointer-events-auto',
            'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl',
            'border border-slate-200 dark:border-slate-700',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300'
          )}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {isSubmitted ? (
            /* Success State */
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {language === 'mm' ? 'ကျေးဇူးတင်ပါသည်!' : 'Thank you!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {language === 'mm'
                  ? 'သင့်ဖြေကြားချက်ကို မှတ်တမ်းတင်ထားပါတယ်။'
                  : 'Your response has been recorded. We appreciate your feedback!'}
              </p>
            </div>
          ) : (
            /* Survey Form */
            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-5">
                <ClipboardList className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>

              {/* Question */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
                {language === 'mm' ? 'Quick Survey' : 'Quick Survey'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-6 text-sm leading-relaxed">
                {language === 'mm'
                  ? 'Report အတွက် ဘယ်လို data types တွေ လိုအပ်ပါသလဲ?'
                  : 'What kind of data types do you need for the report?'}
              </p>

              {/* Answer Input */}
              <Textarea
                value={answer}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                placeholder={
                  language === 'mm'
                    ? 'ဥပမာ - အရောင်းဒေတာ၊ ငွေကြေးဒေတာ၊ ဝန်ထမ်းစာရင်း...'
                    : 'e.g. Sales data, Financial data, Inventory, HR data...'
                }
                rows={3}
                className="mb-4 rounded-xl border-slate-200 dark:border-slate-700"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
                >
                  {language === 'mm' ? 'နောက်မှ' : 'Maybe later'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {language === 'mm' ? 'ပေးပို့ရန်' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
