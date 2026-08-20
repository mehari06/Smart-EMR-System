'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Activity, ClipboardList, FileCheck2, FileText, HeartPulse, Stethoscope, Pill, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const allTabs = [
  { label: 'Summary', href: 'summary', icon: ClipboardList, roles: ['admin', 'doctor', 'nurse'] },
  { label: 'Vitals', href: 'vitals', icon: HeartPulse, roles: ['admin', 'doctor', 'nurse'] },
  { label: 'Diagnoses', href: 'diagnoses', icon: Stethoscope, roles: ['admin', 'doctor'] },
  { label: 'SOAP', href: 'soap', icon: FileText, roles: ['admin', 'doctor'] },
  { label: 'Prescriptions', href: 'prescriptions', icon: Pill, roles: ['admin', 'doctor'] },
  { label: 'Lab Orders', href: 'lab', icon: FlaskConical, roles: ['admin', 'doctor'] },
  { label: 'Radiology', href: 'radiology', icon: FlaskConical, roles: ['admin', 'doctor'] },
  { label: 'Discharge', href: 'discharge', icon: FileCheck2, roles: ['admin', 'doctor', 'nurse'] },
];
export function EncounterSidebar({ patientId, encounterId }: { patientId: number; encounterId: number }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'doctor';
  const basePath = `/patients/${patientId}/encounter/${encounterId}`;
  const tabs = allTabs.filter(tab => tab.roles.includes(role));  

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </div>
          <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {role === 'nurse' ? 'Nurse View' : 'Consultation Hub'}
               </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Encounter #{encounterId}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 p-3" aria-label="Encounter sections">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-accent hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50',
                isActive && 'bg-primary text-white shadow-sm hover:bg-primary hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}