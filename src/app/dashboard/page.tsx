'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  FileSpreadsheet,
  BarChart3,
  Upload,
  CircleDollarSign,
  Package,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { parseCsv } from '@/lib/csv-parser';
import { toast } from 'sonner';
import { GoogleSheetsConnector } from '@/components/sheets/GoogleSheetsConnector';

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);

    try {
      const result = await parseCsv(file);

      if (!result.success || !result.data) {
        toast.error(result.error || 'Failed to parse file');
        setUploading(false);
        return;
      }

      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          columns: result.data.columns,
          rows: result.data.rows,
          language: language,
        }),
      });

      const saveResult = await response.json();

      if (saveResult.success) {
        toast.success(`${result.data.totalRows} rows uploaded!`);
        router.push(`/dashboard/${saveResult.dataset.id}`);
      } else {
        toast.error(saveResult.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Something went wrong during upload');
    } finally {
      setUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  // Always show empty dashboard with zero data
  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header with Upload Button */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-bold">{t('dashboard.homeTitle')}</h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground sm:text-base">
            {t('dashboard.homeSubtitle')}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="w-full gap-2 px-3 sm:w-auto sm:px-4"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span className="truncate">{t('dashboard.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="size-5" />
                <span className="truncate">{t('dashboard.uploadFile')}</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => setSheetsOpen(true)}
            size="lg"
            variant="outline"
            className="w-full gap-2 overflow-hidden border-green-200 px-3 text-green-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 sm:w-auto sm:px-4 dark:border-green-950 dark:hover:bg-green-950/20"
            disabled={uploading}
          >
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm0-4H7v-2h5v2zm0-4H7V7h5v2zm5 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2z"/>
            </svg>
            <span className="truncate">{t('sheets.shortTitle')}</span>
          </Button>
        </div>
      </div>

      {/* Empty KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { title: t('dashboard.kpi.totalSales'), icon: CircleDollarSign },
          { title: t('dashboard.kpi.totalOrders'), icon: Package },
          { title: t('dashboard.kpi.totalQuantity'), icon: BarChart3 },
          { title: t('dashboard.kpi.uniqueCustomers'), icon: Users },
        ].map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden py-0 lg:py-6">
            <CardContent className="p-4 sm:p-5">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm" title={kpi.title}>
                    {kpi.title}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-muted-foreground/50 sm:text-2xl">0</p>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                  <kpi.icon className="size-4" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Line Chart Placeholder */}
        <Card>
          <CardHeader className="px-4 pb-2 sm:px-6">
            <CardTitle className="text-base text-muted-foreground/70">Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent className="flex h-44 flex-col items-center justify-center px-4 text-center sm:h-56 sm:px-6 lg:h-70">
            <BarChart3 className="mb-3 size-10 text-muted-foreground/30 sm:size-12" />
            <p className="text-sm text-muted-foreground">Chart will appear here</p>
          </CardContent>
        </Card>

        {/* Bar Chart Placeholder */}
        <Card>
          <CardHeader className="px-4 pb-2 sm:px-6">
            <CardTitle className="text-base text-muted-foreground/70">Top 10 by Value</CardTitle>
          </CardHeader>
          <CardContent className="flex h-44 flex-col items-center justify-center px-4 text-center sm:h-56 sm:px-6 lg:h-70">
            <BarChart3 className="mb-3 size-10 text-muted-foreground/30 sm:size-12" />
            <p className="text-sm text-muted-foreground">Chart will appear here</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty Data Table */}
      <Card>
        <CardHeader className="px-4 pb-2 sm:px-6">
          <CardTitle className="text-base text-muted-foreground/70">Data Table</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 flex-col items-center justify-center px-4 text-center sm:h-50 sm:px-6">
          <FileSpreadsheet className="mb-3 size-10 text-muted-foreground/30 sm:size-12" />
          <p className="text-pretty text-sm text-muted-foreground">Your data will appear here after upload</p>
        </CardContent>
      </Card>

      {/* Drag and Drop Overlay */}
      <div
        className={`
          fixed inset-0 z-50 bg-violet-600/20 backdrop-blur-sm flex items-center justify-center transition-opacity
          ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <Upload className="h-16 w-16 mx-auto text-violet-600 mb-4" />
          <p className="text-xl font-semibold text-violet-700">Drop your file here!</p>
          <p className="text-muted-foreground mt-2">CSV or Excel files</p>
        </div>
      </div>
      <GoogleSheetsConnector open={sheetsOpen} onOpenChange={setSheetsOpen} />
    </div>
  );
}
