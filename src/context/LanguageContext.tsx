'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import enTranslations from '@/locales/en.json';
import mmTranslations from '@/locales/mm.json';

export type Language = 'en' | 'mm';

type TranslationKeys = typeof enTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const translations: Record<Language, TranslationKeys> = {
  en: enTranslations,
  mm: mmTranslations as TranslationKeys,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to get nested object value by key path
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if path not found
    }
  }

  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[language] as unknown as Record<string, unknown>, key);
    },
    [language]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'en' ? 'mm' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
