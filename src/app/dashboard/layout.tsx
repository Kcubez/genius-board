import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-6 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
