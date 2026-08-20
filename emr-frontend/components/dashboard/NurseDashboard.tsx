'use client';
import { TriagePanel } from '@/components/dashboard/TriagePanel';
import Link from 'next/link';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, DoorOpen, HeartPulse, Stethoscope, UserRoundCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DashboardDataTable,
  DashboardShell,
  QueryState,
  SectionCard,
  SortableHeader,
  StatCard,
  StatGrid,
  formatDateTime,
} from './DashboardShared';
import { useDashboardEncounters, useDashboardTodayAppointments } from '@/hooks/useDashboardData';
import { clinicalApi } from '@/lib/api/clinical';
import type { AppointmentListItem } from '@/types/appointments';
import type { Encounter, VitalSign } from '@/types/clinical';

function abnormalVitals(vital?: VitalSign) {
  if (!vital) return [];
  const alerts = [];
  if (vital.temperature >= 38 || vital.temperature <= 35) alerts.push(`Temp ${vital.temperature} C`);
  if (vital.systolic_pressure >= 140 || vital.diastolic_pressure >= 90 || vital.systolic_pressure < 90) alerts.push(`BP ${vital.systolic_pressure}/${vital.diastolic_pressure}`);
  if (vital.pulse_rate > 110 || vital.pulse_rate < 50) alerts.push(`Pulse ${vital.pulse_rate}`);
  if (vital.oxygen_saturation < 92) alerts.push(`SpO2 ${vital.oxygen_saturation}%`);
  return alerts;
}

export default function NurseDashboard() {
  const appointments = useDashboardTodayAppointments();
  const encounters = useDashboardEncounters({ status: 'O' });
  const appointmentRows = appointments.data ?? [];
  const checkedInRows = appointmentRows.filter((appointment) => appointment.status === 'I');
  const awaitingDoctorRows = appointmentRows.filter((appointment) => appointment.status === 'S');
  const dischargedRows = appointmentRows.filter((appointment) => appointment.status === 'C');

  const encounterRows = encounters.data?.results ?? [];
  const detailQueries = useQueries({
    queries: encounterRows.slice(0, 8).map((encounter) => ({
      queryKey: ['dashboard', 'nurse', 'encounterDetail', encounter.id],
      queryFn: () => clinicalApi.getEncounter(encounter.id),
      staleTime: 1000 * 60,
    })),
  });
  const encounterDetails = detailQueries.map((query) => query.data).filter(Boolean) as Encounter[];
  const alerts = encounterDetails
    .map((encounter) => ({ encounter, alerts: abnormalVitals(encounter.vitalsign) }))
    .filter((item) => item.alerts.length > 0);

  const queueColumns = useMemo<ColumnDef<AppointmentListItem>[]>(() => [
    {
      accessorKey: 'patient.full_name',
      header: ({ column }) => <SortableHeader label="Patient" column={column} />,
      cell: ({ row }) => row.original.patient?.full_name ?? 'Unassigned',
    },
    {
      accessorKey: 'doctor.full_name',
      header: ({ column }) => <SortableHeader label="Doctor" column={column} />,
      cell: ({ row }) => row.original.doctor?.full_name ?? 'Awaiting assignment',
    },
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <SortableHeader label="Time" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.scheduled_at),
    },
    {
      accessorKey: 'reason',
      header: ({ column }) => <SortableHeader label="Reason" column={column} />,
    },
    {
      accessorKey: 'status_display',
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => <Badge>{row.original.status_display}</Badge>,
    },
  ], []);

  return (
    <DashboardShell title="Nurse Dashboard" description="Queue, vitals, triage, and abnormal observation monitoring for today’s patient flow.">
      <StatGrid>
        <StatCard icon={UserRoundCheck} label="Checked-In Today" value={appointments.isLoading ? '...' : checkedInRows.length} tone="teal" trend={{ value: 12, isPositive: true }} chartData={[{value: 10}, {value: 12}, {value: 18}, {value: 15}, {value: 20}, {value: 25}]} />
        <StatCard icon={HeartPulse} label="Pending Vitals" value={appointments.isLoading ? '...' : checkedInRows.length} tone="amber" trend={{ value: 5, isPositive: false }} chartData={[{value: 15}, {value: 14}, {value: 12}, {value: 10}, {value: 8}, {value: 5}]} />
        <StatCard icon={Stethoscope} label="Awaiting Doctor" value={appointments.isLoading ? '...' : awaitingDoctorRows.length} tone="indigo" trend={{ value: 8, isPositive: true }} chartData={[{value: 8}, {value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}]} />
        <StatCard icon={DoorOpen} label="Discharged" value={appointments.isLoading ? '...' : dischargedRows.length} tone="green" trend={{ value: 20, isPositive: true }} chartData={[{value: 20}, {value: 22}, {value: 25}, {value: 28}, {value: 30}, {value: 35}]} />
        <StatCard icon={AlertTriangle} label="Abnormal Vitals" value={detailQueries.some((query) => query.isLoading) ? '...' : alerts.length} tone="rose" />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Checked-In Patient Queue" description="Sortable, filterable queue for triage and vitals capture.">
          <QueryState isLoading={appointments.isLoading} isError={appointments.isError} isEmpty={checkedInRows.length === 0} emptyText="No checked-in patients are waiting." errorText="Unable to load checked-in queue.">
            <DashboardDataTable data={checkedInRows} columns={queueColumns} searchPlaceholder="Filter checked-in patients..." />
          </QueryState>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Triage Quick Actions">
            <div className="grid gap-3">
              <Button asChild variant="outline" className="justify-start"><Link href="/appointments"><CheckCircle2 className="size-4" /> Check In Patient</Link></Button>
              <Button asChild variant="outline" className="justify-start"><Link href="/encounters"><HeartPulse className="size-4" /> Record Vitals</Link></Button>
              <Button asChild variant="outline" className="justify-start"><Link href="/patients"><ClipboardList className="size-4" /> Review Patient Record</Link></Button>
            </div>
          </SectionCard>

          <SectionCard title="Abnormal Vitals Alerts" description="Derived from vitals attached to loaded active encounters.">
            <QueryState isLoading={detailQueries.some((query) => query.isLoading)} isError={detailQueries.some((query) => query.isError)} isEmpty={alerts.length === 0} emptyText="No abnormal vitals detected." errorText="Unable to load abnormal vitals.">
              <div className="space-y-3">
                {alerts.map(({ encounter, alerts: vitalsAlerts }) => (
                  <div key={encounter.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <div className="font-semibold">{encounter.patient.full_name}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {vitalsAlerts.map((alert) => <Badge key={alert} variant="outline">{alert}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </QueryState>
          </SectionCard>
        </div>
      </div>
          <SectionCard title="Pending Triage" description="Patients waiting for initial assessment.">
        <TriagePanel 
          appointments={checkedInRows}
          isLoading={appointments.isLoading} 
        />
      </SectionCard>
    </DashboardShell>
  );
}
