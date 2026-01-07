import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { CsvProvider } from '@/context/CsvContext';
import { FilterProvider } from '@/context/FilterContext';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sales Data Analysis Dashboard',
  description:
    'Upload CSV files and analyze sales data with dynamic filtering, KPIs, and visualizations',
  keywords: ['sales', 'analytics', 'dashboard', 'CSV', 'data analysis'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <LanguageProvider>
          <CsvProvider>
            <FilterProvider>
              <Header />
              <main className="container py-6">{children}</main>
            </FilterProvider>
          </CsvProvider>
        </LanguageProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
