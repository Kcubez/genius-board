'use client';

import React from 'react';
import { Languages, Moon, Sun, Upload, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useCsvContext } from '@/context/CsvContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { isDataLoaded } = useCsvContext();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link href="/">
            <Button variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.upload')}</span>
            </Button>
          </Link>
          {isDataLoaded && (
            <Link href="/dashboard">
              <Button
                variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.title')}</span>
              </Button>
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-2">
            <Languages className="h-4 w-4" />
            <span
              className={cn('font-medium transition-all', language === 'mm' && 'font-pyidaungsu')}
            >
              {language === 'en' ? 'EN' : 'မြန်မာ'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
