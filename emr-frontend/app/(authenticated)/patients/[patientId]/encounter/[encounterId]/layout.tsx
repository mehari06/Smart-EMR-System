import { ReactNode } from 'react';
import { EncounterProvider } from './_provider/EncounterContext';
import PatientHeader from './_components/PatientHeader';
import RightContextPanel from './_components/RightContextPanel';
import { EncounterSidebar } from '@/components/encounters/EncounterSidebar';

export default async function EncounterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ patientId: string; encounterId: string }>;
}) {
  const { patientId: patientIdParam, encounterId: encounterIdParam } = await params;
  const patientId = parseInt(patientIdParam, 10);
  const encounterId = parseInt(encounterIdParam, 10);

  return (
    <EncounterProvider patientId={patientId} encounterId={encounterId}>
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="shrink-0">
          <PatientHeader />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-64 shrink-0 md:block">
            <EncounterSidebar patientId={patientId} encounterId={encounterId} />
          </div>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>

          <div className="hidden w-80 shrink-0 border-l border-border bg-card xl:block">
            <RightContextPanel patientId={patientId} />
          </div>
        </div>
      </div>
    </EncounterProvider>
  );
}