import { AppSidebar } from '@/components/ui/layout/AppSidebar';
import { AppHeader } from '@/components/ui/layout/AppHeader';
import { ReactNode } from 'react';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppSidebar />
      <div className="min-h-screen pl-64">
        <AppHeader breadcrumbs={breadcrumbs} />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}