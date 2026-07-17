'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSidebar } from './DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ukFlag from '../../../UKFlag.png';
import myanmarFlag from '../../../MyanmarFlag.png';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gb-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapse preference
  useEffect(() => {
    localStorage.setItem('gb-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(value => !value)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-[240px] lg:hidden transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        id="mobile-sidebar"
      >
        <DashboardSidebar
          collapsed={false}
          isMobileDrawer
          onClose={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {/* Main area — offset by sidebar width on desktop */}
      <div
        className={cn(
          'flex flex-col min-h-screen pl-0 transition-all duration-300',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-[240px]'
        )}
      >
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 h-[60px] bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl border-b border-violet-100/60 dark:border-violet-900/30 shadow-sm shadow-violet-100/30 flex items-center px-4 sm:px-6 gap-3">

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-violet-50 hover:text-violet-700 transition-colors shrink-0"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            aria-controls="mobile-sidebar"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Genius Board
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Data
          </div>

          {/* ── Language switcher ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-all duration-200 shadow-sm"
                title={language === 'en' ? 'English' : 'Myanmar'}
              >
                <Image
                  src={language === 'en' ? ukFlag : myanmarFlag}
                  alt={language === 'en' ? 'English' : 'Myanmar'}
                  width={20}
                  height={14}
                  className="rounded-sm border border-slate-200/60 object-cover shrink-0"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === 'en' ? 'EN' : 'MM'}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 shadow-xl border-slate-200/80">
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={cn(
                  'rounded-lg gap-2 cursor-pointer',
                  language === 'en' && 'bg-violet-50 text-violet-700 font-medium'
                )}
              >
                <Image src={ukFlag} alt="English" width={20} height={14} className="rounded-sm shrink-0" />
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('mm')}
                className={cn(
                  'rounded-lg gap-2 cursor-pointer',
                  language === 'mm' && 'bg-violet-50 text-violet-700 font-medium'
                )}
              >
                <Image src={myanmarFlag} alt="Myanmar" width={20} height={14} className="rounded-sm shrink-0" />
                Myanmar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── User profile ── */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-300 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-all duration-200 shadow-sm group">
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-0 overflow-hidden rounded-2xl border-violet-100 dark:border-violet-900/50 shadow-xl">
                {/* Gradient header */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-white/70 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-1">
                  <DropdownMenuSeparator className="my-0" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 cursor-pointer rounded-xl mx-1 my-1 gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 container py-5 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
