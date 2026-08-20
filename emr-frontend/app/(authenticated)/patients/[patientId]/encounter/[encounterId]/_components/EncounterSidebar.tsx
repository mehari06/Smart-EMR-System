'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, Activity, Stethoscope, 
  History, TrendingUp, Edit3 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EncounterSidebarProps {
  patientId: number;
  encounterId: number;
}

export default function EncounterSidebar({ patientId, encounterId }: EncounterSidebarProps) {
  const pathname = usePathname();
  const basePath = `/patients/${patientId}/encounter/${encounterId}`;

  const tabs = [
    { name: 'Summary', path: 'summary', icon: FileText },
    { name: 'Vitals & Observation', path: 'vitals', icon: Activity },
    { name: 'Diagnoses', path: 'diagnoses', icon: Stethoscope },
    { name: 'Conditions (History)', path: 'conditions', icon: History },
    { name: 'Trends', path: 'trends', icon: TrendingUp },
    { name: 'SOAP Notes', path: 'soap', icon: Edit3 },
  ];

  return (
    <div className="h-full py-4 flex flex-col">
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Encounter Tabs
        </h3>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.path}`;
          const isActive = pathname.startsWith(href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              href={href}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'mr-3 flex-shrink-0 h-5 w-5',
                  isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-500'
                )}
                aria-hidden="true"
              />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
