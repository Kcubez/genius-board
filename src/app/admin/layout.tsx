import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">{children}</div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
