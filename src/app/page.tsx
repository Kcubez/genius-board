'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, FileSpreadsheet, Filter, Globe, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CsvUploader } from '@/components/csv/CsvUploader';
import { CsvTable } from '@/components/csv/CsvTable';
import { useCsvContext } from '@/context/CsvContext';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const router = useRouter();
  const { csvData, isDataLoaded } = useCsvContext();
  const { t } = useLanguage();

  const handleUploadComplete = () => {
    // Optionally auto-navigate to dashboard
  };

  const features = [
    {
      icon: <FileSpreadsheet className="h-6 w-6" />,
      title: 'CSV Upload',
      description: 'Drag & drop your CSV files with automatic column detection',
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: 'Dynamic Filters',
      description: 'Auto-generated filters based on your data columns',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Real-time Charts',
      description: 'Interactive visualizations that update with your filters',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Bilingual Support',
      description: 'Switch between English and Myanmar languages',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {t('dashboard.title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your CSV sales data and instantly view, filter, analyze, and visualize with dynamic
          dashboards
        </p>
      </section>

      {/* Upload Section */}
      <section className="max-w-2xl mx-auto">
        <CsvUploader onUploadComplete={handleUploadComplete} />
      </section>

      {/* Go to Dashboard Button */}
      {isDataLoaded && (
        <section className="flex justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/dashboard')}
            className="gap-2 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {/* Data Preview */}
      {isDataLoaded && csvData && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                {t('upload.preview')} - {csvData.fileName}
              </CardTitle>
              <CardDescription>
                {csvData.totalRows} {t('common.rows')} • {csvData.columns.length}{' '}
                {t('common.columns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CsvTable data={csvData.rows} columns={csvData.columns} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Features Grid */}
      {!isDataLoaded && (
        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-full bg-linear-to-r from-violet-500/20 to-purple-500/20 flex items-center justify-center text-violet-600">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
