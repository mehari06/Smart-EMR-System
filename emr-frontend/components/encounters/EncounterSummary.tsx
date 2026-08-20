'use client';

import { Activity, CalendarClock, ClipboardList, Stethoscope, UserRound } from 'lucide-react';
import { useEncounter } from '@/hooks/useEncounter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EncounterSummary({ encounterId }: { encounterId: number }) {
  const { data: encounter, isLoading, isError } = useEncounter(encounterId);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-44 rounded-xl lg:col-span-2" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-3" />
      </div>
    );
  }

  if (isError || !encounter) {
    return <p className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">Unable to load encounter summary.</p>;
  }

  const patientName = encounter.patient?.full_name ?? `Patient #${encounter.patient?.id ?? '-'}`;
  const doctorName = encounter.doctor?.full_name ?? 'Unassigned';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={UserRound} label="Patient" value={patientName} />
        <StatCard icon={Stethoscope} label="Doctor" value={doctorName} />
        <StatCard icon={CalendarClock} label="Started" value={new Date(encounter.started_at).toLocaleString()} />
        <StatCard icon={Activity} label="Status" value={encounter.status_display ?? encounter.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Clinical Overview</CardTitle>
                <CardDescription>Chief complaint and current documentation state.</CardDescription>
              </div>
              <Badge variant={encounter.status === 'O' ? 'default' : 'secondary'}>{encounter.status_display}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chief Complaint</h3>
              <p className="mt-2 rounded-lg border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {encounter.chief_complaint || 'No chief complaint recorded.'}
              </p>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">SOAP Documentation</h3>
              <p className="mt-2 text-sm text-slate-500">
                {encounter.clinical_notes ? 'Clinical notes are in progress.' : 'No SOAP notes have been saved yet.'}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encounter Counts</CardTitle>
            <CardDescription>Linked clinical records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CountRow label="Vitals" value={encounter.vitalsign ? 1 : 0} />
            <CountRow label="Diagnoses" value={encounter.diagnoses?.length ?? 0} />
            <CountRow label="Prescriptions" value={encounter.prescriptions?.length ?? 0} />
            <CountRow label="Lab Orders" value={encounter.lab_orders?.length ?? 0} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discharge Summary</CardTitle>
          <CardDescription>Final summary once the encounter is completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {encounter.discharge_summary || 'No discharge summary has been recorded.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 pt-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}