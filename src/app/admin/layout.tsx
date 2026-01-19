import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col">{children}</div>
      <footer className="py-6">
        <p className="text-sm text-slate-500 text-center">
          © {currentYear} Genius Board. All rights reserved.
        </p>
      </footer>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
