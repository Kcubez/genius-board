'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HelpCircle,
  Lightbulb,
  Bug,
  MessageSquare,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { Textarea } from '../ui/textarea';

interface Message {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: Date;
  feedbackType?: string;
}

type FeedbackType = 'feature_inquiry' | 'feature_request' | 'bug_report' | 'general';

const feedbackTypes = [
  {
    value: 'feature_inquiry' as FeedbackType,
    label: 'Ask about a feature',
    labelMm: 'Feature အကြောင်း မေးမယ်',
    icon: HelpCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    value: 'feature_request' as FeedbackType,
    label: 'Request a feature',
    labelMm: 'Feature တောင်းဆိုမယ်',
    icon: Lightbulb,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
  },
  {
    value: 'bug_report' as FeedbackType,
    label: 'Report a bug',
    labelMm: 'Bug တင်ပြမယ်',
    icon: Bug,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20',
  },
  {
    value: 'general' as FeedbackType,
    label: 'General feedback',
    labelMm: 'အထွေထွေ feedback',
    icon: MessageSquare,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10 hover:bg-violet-500/20',
  },
];

export function FeedbackWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Show hint tooltip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowHint(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Hide hint when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowHint(false);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showTypeSelector) {
      inputRef.current?.focus();
    }
  }, [isOpen, showTypeSelector]);

  // Add welcome message when type is selected
  useEffect(() => {
    if (selectedType && messages.length === 0) {
      const welcomeMessages: Record<FeedbackType, { en: string; mm: string }> = {
        feature_inquiry: {
          en: "Hi! 👋 Ask me about any feature and I'll help you find it or explain how it works.",
          mm: 'မင်္ဂလာပါ! 👋 Feature တစ်ခုခုအကြောင်း မေးကြည့်ပါ။ ရှင်းပြပေးပါမယ်။',
        },
        feature_request: {
          en: "Great! 💡 Tell me what feature you'd like to see. Your feedback helps us improve!",
          mm: 'ကောင်းပါသည်! 💡 ဘယ်လို feature လိုချင်လဲ ပြောပြပေးပါ။',
        },
        bug_report: {
          en: "I'm sorry you encountered an issue. 🐛 Please describe what happened - include steps to reproduce if possible.",
          mm: 'ပြဿနာ တွေ့လို့ စိတ်မကောင်းပါဘူး။ 🐛 ဘာဖြစ်လဲ အသေးစိတ် ပြောပြပေးပါ။',
        },
        general: {
          en: 'Hi there! 💬 Share any thoughts or suggestions. We love hearing from you!',
          mm: 'မင်္ဂလာပါ! 💬 အကြံဉာဏ်တွေ မျှဝေပေးပါ။',
        },
      };

      setMessages([
        {
          id: 'welcome',
          type: 'system',
          content:
            language === 'mm' ? welcomeMessages[selectedType].mm : welcomeMessages[selectedType].en,
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedType, messages.length, language]);

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    setMessages([]);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || !selectedType || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      feedbackType: selectedType,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          message: inputValue.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          type: 'system',
          content:
            data.autoResponse ||
            (language === 'mm'
              ? '✅ သင့် feedback ကို လက်ခံရရှိပါတယ်။ ကျေးဇူးတင်ပါသည်!'
              : "✅ Thanks for your feedback! We've received it and will review it soon."),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'system',
          content:
            language === 'mm'
              ? '❌ တစ်ခုခု မှားသွားပါတယ်။ ပြန်ကြိုးစားကြည့်ပါ။'
              : '❌ Something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBack = () => {
    setShowTypeSelector(true);
    setSelectedType(null);
    setMessages([]);
    setInputValue('');
  };

  return (
    <>
      {/* Attention Hint Tooltip */}
      {showHint && !isOpen && (
        <div
          className="fixed bottom-22 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
          onClick={() => setShowHint(false)}
        >
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg px-4 py-3 max-w-48 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {language === 'mm' ? '💬 အကူအညီလိုပါသလား?' : '💬 Need help?'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'mm' ? 'ကျွန်တော်တို့ကို မေးပါ!' : 'Ask us anything!'}
            </p>
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 rotate-45" />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          'bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
          'flex items-center justify-center',
          'hover:scale-110 active:scale-95',
          isOpen && 'rotate-90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 w-90 sm:w-100 transition-all duration-300 origin-bottom-right',
          'rounded-2xl shadow-2xl overflow-hidden',
          'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-violet-600 to-purple-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {language === 'mm' ? 'အကူအညီ & Feedback' : 'Help & Feedback'}
                </h3>
                <p className="text-white/70 text-xs">
                  {language === 'mm'
                    ? 'ကျွန်တော်တို့ကို ပြောပြပေးပါ'
                    : "We'd love to hear from you"}
                </p>
              </div>
            </div>
            {!showTypeSelector && (
              <button
                onClick={handleBack}
                className="text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1"
              >
                <ChevronDown className="h-3 w-3 rotate-90" />
                {language === 'mm' ? 'နောက်သို့' : 'Back'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="h-100 flex flex-col">
          {showTypeSelector ? (
            /* Type Selector */
            <div className="flex-1 p-4 space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'mm' ? 'ဘယ်လို အကူအညီ လိုပါသလဲ?' : 'How can we help you today?'}
              </p>
              {feedbackTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    'w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700',
                    'flex items-center gap-3 transition-all duration-200',
                    type.bgColor
                  )}
                >
                  <div className={cn('p-2 rounded-lg', type.bgColor)}>
                    <type.icon className={cn('h-5 w-5', type.color)} />
                  </div>
                  <span className="font-medium text-sm text-left">
                    {language === 'mm' ? type.labelMm : type.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Chat View */
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                        message.type === 'user'
                          ? 'bg-linear-to-r from-violet-600 to-purple-600 text-white rounded-br-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                        <span className="text-sm text-muted-foreground">
                          {language === 'mm' ? 'စဉ်းစားနေပါတယ်...' : 'Thinking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInputValue(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'mm' ? 'မက်ဆေ့ ရိုက်ပါ...' : 'Type your message...'}
                    className="min-h-11 max-h-30 resize-none rounded-xl border-slate-200 dark:border-slate-700"
                    rows={1}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isLoading}
                    className="h-11 w-11 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
