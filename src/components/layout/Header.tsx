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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-8 w-8 rounded-lg bg-linear-to-r from-violet-500 to-purple-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Genius Board
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-24 justify-between gap-2 rounded-2xl border-slate-200/70 bg-white/90 px-3 shadow-sm transition hover:bg-white hover:shadow-md sm:gap-3"
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
                <span className="flex items-center gap-2 translate-x-[-8px]">
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
                <span className="flex items-center gap-2 translate-x-[-8px]">
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
            className="gap-2 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 hover:border-violet-300 transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">All Reports</span>
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-37.5 truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
