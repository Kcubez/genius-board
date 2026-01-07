'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseCsv } from '@/lib/csv-parser';
import { useCsvContext } from '@/context/CsvContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface CsvUploaderProps {
  onUploadComplete?: () => void;
}

export function CsvUploader({ onUploadComplete }: CsvUploaderProps) {
  const { setCsvData, setUploadState, uploadState } = useCsvContext();
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setUploadState({
          error: t('errors.CSV_INVALID'),
          isUploading: false,
        });
        return;
      }

      setSelectedFile(file);
      setUploadState({ isUploading: true, progress: 0, error: null });

      try {
        // Simulate progress
        setUploadState({ progress: 30 });

        const result = await parseCsv(file);

        setUploadState({ progress: 70 });

        if (result.success && result.data) {
          setUploadState({ progress: 100, isUploading: false });
          setCsvData(result.data);
          onUploadComplete?.();
        } else {
          setUploadState({
            error: result.errorCode ? t(`errors.${result.errorCode}`) : result.error,
            isUploading: false,
          });
        }
      } catch (error) {
        setUploadState({
          error: t('errors.PARSE_ERROR'),
          isUploading: false,
        });
      }
    },
    [setCsvData, setUploadState, t, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadState({ error: null, isUploading: false, progress: 0 });
  }, [setUploadState]);

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-all duration-300',
        isDragging && 'border-primary bg-primary/5 scale-[1.02]',
        uploadState.error && 'border-destructive',
        !isDragging && !uploadState.error && 'border-muted-foreground/25 hover:border-primary/50'
      )}
    >
      <CardContent className="p-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center text-center min-h-[200px]"
        >
          {uploadState.isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">{t('upload.analyzing')}</p>
              <div className="w-48 bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          ) : uploadState.error ? (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive font-medium">{uploadState.error}</p>
              <Button variant="outline" onClick={handleClearFile}>
                {t('common.clear')}
              </Button>
            </div>
          ) : selectedFile && uploadState.data ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{selectedFile.name}</span>
                <button onClick={handleClearFile} className="p-1 hover:bg-secondary rounded">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {uploadState.data.totalRows} {t('common.rows')} • {uploadState.data.columns.length}{' '}
                {t('common.columns')}
              </p>
              <p className="text-green-600 text-sm">{t('upload.ready')}</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'rounded-full p-4 mb-4 transition-colors',
                  isDragging ? 'bg-primary/20' : 'bg-secondary'
                )}
              >
                <Upload
                  className={cn('h-10 w-10', isDragging ? 'text-primary' : 'text-muted-foreground')}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('upload.title')}</h3>
              <p className="text-muted-foreground mb-4">{t('upload.dragDrop')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('upload.or')}</p>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                <Button asChild>
                  <span>{t('upload.browse')}</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                {t('upload.supportedFormat')} • {t('upload.maxSize')}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
