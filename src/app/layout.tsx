import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { CsvProvider } from '@/context/CsvContext';
import { FilterProvider } from '@/context/FilterContext';
import { AuthProvider } from '@/context/AuthContext';
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
  title: 'Genius Board',
  description:
    'Upload CSV files and analyze sales data with dynamic filtering, KPIs, and visualizations',
  keywords: ['sales', 'analytics', 'dashboard', 'CSV', 'data analysis', 'genius board'],
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
        <AuthProvider>
          <LanguageProvider>
            <CsvProvider>
              <FilterProvider>{children}</FilterProvider>
            </CsvProvider>
          </LanguageProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
