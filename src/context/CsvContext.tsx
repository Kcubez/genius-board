'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CsvData, CsvUploadState } from '@/types/csv';

interface CsvContextType {
  csvData: CsvData | null;
  uploadState: CsvUploadState;
  setCsvData: (data: CsvData | null) => void;
  setUploadState: (state: Partial<CsvUploadState>) => void;
  clearData: () => void;
  isDataLoaded: boolean;
}

const initialUploadState: CsvUploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  data: null,
};

const CsvContext = createContext<CsvContextType | undefined>(undefined);

export function CsvProvider({ children }: { children: ReactNode }) {
  const [csvData, setCsvDataState] = useState<CsvData | null>(null);
  const [uploadState, setUploadStateInternal] = useState<CsvUploadState>(initialUploadState);

  const setCsvData = useCallback((data: CsvData | null) => {
    setCsvDataState(data);
    if (data) {
      setUploadStateInternal(prev => ({ ...prev, data, error: null }));
    }
  }, []);

  const setUploadState = useCallback((state: Partial<CsvUploadState>) => {
    setUploadStateInternal(prev => ({ ...prev, ...state }));
  }, []);

  const clearData = useCallback(() => {
    setCsvDataState(null);
    setUploadStateInternal(initialUploadState);
  }, []);

  const isDataLoaded = csvData !== null && csvData.rows.length > 0;

  return (
    <CsvContext.Provider
      value={{
        csvData,
        uploadState,
        setCsvData,
        setUploadState,
        clearData,
        isDataLoaded,
      }}
    >
      {children}
    </CsvContext.Provider>
  );
}

export function useCsvContext() {
  const context = useContext(CsvContext);
  if (context === undefined) {
    throw new Error('useCsvContext must be used within a CsvProvider');
  }
  return context;
}
