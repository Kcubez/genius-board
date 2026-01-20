'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { parseCsv } from '@/lib/csv-parser';
import { toast } from 'sonner';

interface Dataset {
  id: string;
  name: string;
  fileName: string;
  rowCount: number;
  createdAt: string;
  columns: { name: string; type: string }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; dataset: Dataset | null }>({
    open: false,
    dataset: null,
  });
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/datasets');
      const result = await response.json();
      if (result.success) {
        setDatasets(result.datasets);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);

    try {
      const result = await parseCsv(file);

      if (!result.success || !result.data) {
        toast.error('Failed to parse file');
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
        setShowUploadModal(false);
        router.push(`/dashboard/${saveResult.dataset.id}`);
      } else {
        throw new Error(saveResult.error);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (dataset: Dataset, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ open: true, dataset });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteModal.dataset) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/datasets/${deleteModal.dataset.id}`, { method: 'DELETE' });
      if ((await response.json()).success) {
        setDatasets(prev => prev.filter(d => d.id !== deleteModal.dataset?.id));
        toast.success('Dataset deleted');
        setDeleteModal({ open: false, dataset: null });
      }
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  // Empty state - no reports yet
  if (datasets.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="h-9 w-9 rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-violet-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                My Reports
              </h1>
              <p className="text-muted-foreground">No reports uploaded yet</p>
            </div>
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

        {/* Empty State Card */}
        <Card className="p-12 text-center border-dashed border-2 border-violet-200 bg-violet-50/30">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
          <p className="text-muted-foreground mb-6">
            Upload your first CSV or Excel file to get started
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        </Card>
      </div>
    );
  }

  // Has datasets - show grid
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="h-9 w-9 rounded-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all"
          >
            <ArrowLeft className="h-4 w-4 text-violet-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              My Reports
            </h1>
            <p className="text-muted-foreground">
              {datasets.length} report{datasets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          size="lg"
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="h-5 w-5" />
          New Report
        </Button>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Report</DialogTitle>
          </DialogHeader>

          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${
                isDragging
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/50'
              }
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-10 w-10 mx-auto text-violet-600 animate-spin" />
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-violet-600 mb-4" />
                <p className="font-medium mb-1">Drop file here or click</p>
                <p className="text-sm text-muted-foreground">CSV or Excel</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dataset Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map(dataset => (
          <Card
            key={dataset.id}
            className="cursor-pointer group hover:shadow-xl hover:shadow-violet-100 hover:border-violet-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            onClick={() => router.push(`/dashboard/${dataset.id}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1 rounded-full transition-colors"
                  onClick={e => handleDeleteClick(dataset, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <h3 className="font-semibold text-lg mb-2 truncate group-hover:text-violet-700 transition-colors">
                {dataset.name}
              </h3>

              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-600 font-medium">
                  {dataset.rowCount.toLocaleString()} rows
                </span>
                <span className="text-muted-foreground">
                  {new Date(dataset.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModal.open}
        onOpenChange={open =>
          !deleting && setDeleteModal({ open, dataset: open ? deleteModal.dataset : null })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Report?</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteModal.dataset?.name}</span>? This will
              permanently remove all {deleteModal.dataset?.rowCount.toLocaleString()} rows of data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, dataset: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
