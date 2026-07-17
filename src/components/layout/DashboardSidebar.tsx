'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  FileSpreadsheet,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RecentDataset {
  id: string;
  name: string;
  rowCount: number;
}

const mainNav = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'All Reports',
    href: '/dashboard/reports',
    icon: FolderOpen,
    exact: false,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    exact: true,
  },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

/* ─── Tooltip wrapper — shows tooltip only when sidebar is collapsed ─── */
function SidebarTooltip({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="rounded-lg px-3 py-1.5 text-xs font-medium shadow-xl"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardSidebar({
  collapsed,
  onToggle,
  onNavigate,
  isMobileDrawer = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [recentDatasets, setRecentDatasets] = useState<RecentDataset[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        setLoadingRecent(true);
        const res = await fetch('/api/datasets?limit=5');
        const data = await res.json();
        if (data.success && Array.isArray(data.datasets)) {
          setRecentDatasets(data.datasets.slice(0, 5));
        }
      } catch {
        // silently fail — recent list is non-critical
      } finally {
        setLoadingRecent(false);
      }
    }
    fetchRecent();
  }, [pathname]);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const isDatasetActive = (id: string) => pathname === `/dashboard/${id}`;


  return (
    <aside
      role="navigation"
      aria-label="Main sidebar"
      className={cn(
        'fixed left-0 top-0 z-40 h-full flex flex-col select-none',
        'bg-[#0F172A]',
        'border-r border-white/[0.06]',
        'shadow-[2px_0_24px_rgba(0,0,0,0.3)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* ── Logo ── */}
      <div className={cn(
        'flex items-center h-[60px] border-b border-white/[0.06] shrink-0',
        collapsed && !isMobileDrawer ? 'justify-center px-0' : 'justify-between px-5'
      )}>
        {(!collapsed || isMobileDrawer) && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 overflow-hidden group min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0 group-hover:shadow-violet-500/40 group-hover:scale-105 transition-all duration-200">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-[15px] text-white whitespace-nowrap truncate">
                Genius Board
              </span>
            )}
          </Link>
        )}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        )}
        {!isMobileDrawer && collapsed && (
          <SidebarTooltip collapsed label="Open sidebar">
            <button
              type="button"
              onClick={onToggle}
              className="group relative flex size-9 items-center justify-center text-slate-400 transition-colors duration-200 hover:text-white"
              aria-label="Open sidebar"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25 transition-opacity duration-200 group-hover:opacity-0" />
              <LayoutDashboard className="relative size-4 text-white transition-opacity duration-200 group-hover:opacity-0" />
              <PanelLeftOpen className="absolute size-5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </button>
          </SidebarTooltip>
        )}
        {!isMobileDrawer && !collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={12}
              className="rounded-lg px-3 py-1.5 text-xs font-medium shadow-xl"
            >
              Close sidebar
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col sidebar-scroll">

        {/* ── Section label: Menu ── */}
        {!collapsed && (
          <p className="px-5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Menu
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {/* ── Main Nav ── */}
        <nav className={cn('px-3 space-y-1', collapsed && 'px-2')} aria-label="Main menu">
          {mainNav.map(item => {
            const active = isActive(item.href, item.exact ?? false);
            const Icon = item.icon;
            return (
              <SidebarTooltip key={item.label} collapsed={collapsed} label={item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                    collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                  )}
                >
                  {/* Active left accent bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-400" />
                  )}
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                    active
                      ? 'bg-violet-600 shadow-md shadow-violet-500/30 text-white'
                      : 'bg-white/[0.06] text-slate-400 group-hover:bg-white/[0.1] group-hover:text-slate-200'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </SidebarTooltip>
            );
          })}
        </nav>

        {/* ── Section divider ── */}
        <div className={cn('mx-3 my-3', collapsed && 'mx-2')}>
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ── Recent Reports (expanded) ── */}
        {!collapsed && (
          <div className="flex-1 min-h-0">
            <p className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Recent Reports
            </p>
            <div className="px-3 space-y-0.5">
              {loadingRecent ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : recentDatasets.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500 italic">No reports yet</p>
              ) : (
                recentDatasets.map(ds => {
                  const active = isDatasetActive(ds.id);
                  return (
                    <Link
                      key={ds.id}
                      href={`/dashboard/${ds.id}`}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 group cursor-pointer',
                        active
                          ? 'bg-white/[0.08] text-white'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                      )}
                    >
                      {/* Active left accent bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-violet-400" />
                      )}
                      <div className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors',
                        active
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/[0.06] text-slate-500 group-hover:bg-white/[0.1]'
                      )}>
                        <FileSpreadsheet className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium leading-none mb-0.5">{ds.name}</p>
                        <p className="text-[10px] text-slate-500">{ds.rowCount.toLocaleString()} rows</p>
                      </div>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 animate-pulse" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Recent Reports (collapsed — icon only) ── */}
        {collapsed && recentDatasets.length > 0 && (
          <div className="px-2 space-y-0.5">
            {recentDatasets.slice(0, 4).map(ds => {
              const active = isDatasetActive(ds.id);
              return (
                <SidebarTooltip key={ds.id} collapsed={collapsed} label={ds.name}>
                  <Link
                    href={`/dashboard/${ds.id}`}
                    onClick={onNavigate}
                    className={cn(
                      'relative flex justify-center p-3 rounded-xl transition-all duration-200 cursor-pointer',
                      active
                        ? 'bg-white/[0.08]'
                        : 'hover:bg-white/[0.05]'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-violet-400" />
                    )}
                    <div className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                      active ? 'bg-violet-600 text-white' : 'bg-white/[0.06] text-slate-500'
                    )}>
                      <FileSpreadsheet className="h-3 w-3" />
                    </div>
                  </Link>
                </SidebarTooltip>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
