import { DashboardShell } from '@/components/layout/DashboardShell';
import { SurveyPopup } from '@/components/feedback/SurveyPopup';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <SurveyPopup />
    </>
  );
}
