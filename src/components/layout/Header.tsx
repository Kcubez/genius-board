'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown, LayoutDashboard, LogOut, User, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ukFlag from '../../../UKFlag.png';
import myanmarFlag from '../../../MyanmarFlag.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function Header() {
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-violet-100/60 dark:border-violet-900/30 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl shadow-sm shadow-violet-100/40 dark:shadow-violet-900/20">
      <div className="container flex h-14 items-center justify-between gap-2">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-base sm:text-lg shrink-0 group"
        >
          <div className="h-8 w-8 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 group-hover:shadow-violet-500/40 group-hover:scale-105 transition-all duration-200">
            <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent hidden min-[360px]:inline font-extrabold">
            Genius Board
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 sm:h-10 w-20 sm:w-24 justify-between gap-1 sm:gap-2 rounded-2xl border-slate-200/70 bg-white/90 px-2 sm:px-3 shadow-sm transition hover:bg-white hover:shadow-md"
              >
                <span className="flex items-center gap-2">
                  <Image
                    src={language === 'en' ? ukFlag : myanmarFlag}
                    alt={language === 'en' ? 'English' : 'Myanmar'}
                    width={24}
                    height={16}
                    className="h-4 w-6 rounded-sm border border-slate-200/80 object-cover"
                  />
                  <span className={cn('font-medium', language === 'mm' && 'font-pyidaungsu')}>
                    {language === 'en' ? 'EN' : 'MM'}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-24! rounded-2xl border-slate-200 p-1 shadow-xl"
            >
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
              >
                <span className="flex items-center gap-2 translate-x-2">
                  <Image
                    src={ukFlag}
                    alt="English"
                    width={24}
                    height={16}
                    className={cn(
                      'h-4 w-6 rounded-sm border border-slate-200/80 object-cover',
                      language === 'en' && 'ring-1 ring-violet-200'
                    )}
                  />
                  <span className="font-medium">EN</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('mm')}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
              >
                <span className="flex items-center gap-2 translate-x-2">
                  <Image
                    src={myanmarFlag}
                    alt="Myanmar"
                    width={24}
                    height={16}
                    className={cn(
                      'h-4 w-6 rounded-sm border border-slate-200/80 object-cover',
                      language === 'mm' && 'ring-1 ring-violet-200'
                    )}
                  />
                  <span className={cn('font-medium', language === 'mm' && 'font-pyidaungsu')}>
                    MM
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* All Reports Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/reports')}
            className="gap-1.5 border-violet-200 bg-violet-50/80 text-violet-700 hover:bg-violet-100 hover:text-violet-800 hover:border-violet-300 transition-all rounded-xl text-xs font-semibold"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All Reports</span>
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors px-2"
                >
                  {/* Avatar circle with initials */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {(user.name || user.email || 'U')
                      .split(' ')
                      .slice(0, 2)
                      .map(n => n[0]?.toUpperCase())
                      .join('')}
                  </div>
                  <span className="hidden sm:inline max-w-32 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-0 overflow-hidden rounded-2xl border-violet-100 dark:border-violet-900/50 shadow-xl">
                {/* Avatar header */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    {(user.name || user.email || 'U')
                      .split(' ')
                      .slice(0, 2)
                      .map(n => n[0]?.toUpperCase())
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-white/70 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-1">
                  <DropdownMenuSeparator className="my-0" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer rounded-xl mx-1 my-1">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
