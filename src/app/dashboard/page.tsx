'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileSpreadsheet, BarChart3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { parseCsv } from '@/lib/csv-parser';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
        }),
      });

      const saveResult = await response.json();

      if (saveResult.success) {
        toast.success(`${result.data.totalRows} rows uploaded!`);
        router.push(`/dashboard/${saveResult.dataset.id}`);
      } else {
        throw new Error(saveResult.error);
      }
    } catch (error) {
      toast.error('Upload failed');
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
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Upload a file to see your data insights</p>
        </div>
        <div>
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
            className="gap-2 bg-violet-600 hover:bg-violet-700"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Sales', icon: '💰' },
          { title: 'Total Orders', icon: '📦' },
          { title: 'Total Quantity', icon: '📊' },
          { title: 'Customers', icon: '👥' },
        ].map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold text-muted-foreground/50 mt-1">0</p>
                </div>
                <span className="text-2xl opacity-50">{kpi.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Line Chart Placeholder */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground/70">Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-70 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Chart will appear here</p>
          </CardContent>
        </Card>

        {/* Bar Chart Placeholder */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground/70">Top 10 by Value</CardTitle>
          </CardHeader>
          <CardContent className="h-70 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Chart will appear here</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty Data Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-muted-foreground/70">Data Table</CardTitle>
        </CardHeader>
        <CardContent className="h-50 flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Your data will appear here after upload</p>
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
    </div>
  );
}
