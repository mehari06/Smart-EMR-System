'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarClock, Clock3, FileText, FlaskConical, Pill, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useDashboardAppointments, useDashboardEncounters } from '@/hooks/useDashboardData';
import { useCancelAppointment, useRescheduleAppointment } from '@/hooks/useAppointments';
import { clinicalApi } from '@/lib/api/clinical';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppointmentListItem } from '@/types/appointments';
import type { Encounter } from '@/types/clinical';

function AppointmentActions({ appointment }: { appointment: AppointmentListItem }) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const reschedule = useRescheduleAppointment();
  const cancel = useCancelAppointment();

  return (
    <div className="flex items-center gap-2">
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm"><RefreshCw className="size-3.5" /> Reschedule</Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Select a new date and time for this appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            <Textarea placeholder="Optional note" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!scheduledAt || reschedule.isPending} onClick={() => reschedule.mutate({ id: appointment.id, data: { scheduled_at: scheduledAt, notes } }, { onSuccess: () => setRescheduleOpen(false) })}>
              {reschedule.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm"><XCircle className="size-3.5" /> Cancel</Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Confirm cancellation and optionally provide a reason.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Cancellation reason" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>Keep Appointment</Button>
            <Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: appointment.id, data: { notes } }, { onSuccess: () => setCancelOpen(false) })}>
              {cancel.isPending ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PatientDashboard() {
  const user = useAuthStore((state) => state.user);
  const patientId = user?.id;
  const enabled = !!patientId;

  const appointments = useDashboardAppointments({ patient: patientId ?? 0, page_size: 20 }, enabled);
  const encounters = useDashboardEncounters({ patient: patientId }, enabled);
  const appointmentRows = appointments.data?.results ?? [];
  const upcomingRows = appointmentRows.filter((appointment) => appointment.status === 'S' && new Date(appointment.scheduled_at).getTime() >= Date.now());
  const encounterRows = encounters.data?.results ?? [];

  const detailQueries = useQueries({
    queries: encounterRows.slice(0, 5).map((encounter) => ({
      queryKey: ['dashboard', 'patient', 'encounterDetail', encounter.id],
      queryFn: () => clinicalApi.getEncounter(encounter.id),
      enabled,
      staleTime: 1000 * 60,
    })),
  });
  const encounterDetails = detailQueries.map((query) => query.data).filter(Boolean) as Encounter[];
  const latestEncounter = encounterRows[0];
  const activePrescriptions = encounterDetails.flatMap((encounter) => encounter.prescriptions ?? []).filter((prescription: any) => prescription.status !== 'C' && prescription.status !== 'X');
  const latestLab = encounterDetails.flatMap((encounter) => encounter.lab_orders ?? []).sort((a: any, b: any) => new Date(b.ordered_at ?? 0).getTime() - new Date(a.ordered_at ?? 0).getTime())[0];

  const columns = useMemo<ColumnDef<AppointmentListItem>[]>(() => [
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <SortableHeader label="Date & Time" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.scheduled_at),
    },
    {
      accessorKey: 'doctor.full_name',
      header: ({ column }) => <SortableHeader label="Doctor" column={column} />,
      cell: ({ row }) => row.original.doctor?.full_name ?? 'To be assigned',
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
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <AppointmentActions appointment={row.original} />,
    },
  ], []);

  return (
    <DashboardShell title="Patient Dashboard" description="Personal appointments, encounters, prescriptions, and lab status for the authenticated patient only.">
      <StatGrid>
        <StatCard icon={CalendarClock} label="Upcoming Appointments" value={appointments.isLoading ? '...' : upcomingRows.length} tone="teal" trend={{ value: 20, isPositive: true }} chartData={[{value: 2}, {value: 4}, {value: 3}, {value: 6}, {value: 5}, {value: 8}]} />
        <StatCard icon={Clock3} label="Last Encounter" value={encounters.isLoading ? '...' : latestEncounter ? formatDateTime(latestEncounter.started_at) : '-'} tone="blue" trend={{ value: 5, isPositive: false }} chartData={[{value: 5}, {value: 4}, {value: 5}, {value: 3}, {value: 4}, {value: 2}]} />
        <StatCard icon={Pill} label="Active Prescriptions" value={detailQueries.some((query) => query.isLoading) ? '...' : activePrescriptions.length} tone="green" trend={{ value: 10, isPositive: true }} chartData={[{value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}, {value: 20}]} />
        <StatCard icon={FlaskConical} label="Latest Lab Result" value={detailQueries.some((query) => query.isLoading) ? '...' : latestLab?.status_display ?? latestLab?.status ?? '-'} tone="amber" />
      </StatGrid>

      <SectionCard title="Upcoming Appointments" description="Reschedule or cancel scheduled appointments.">
        <QueryState isLoading={appointments.isLoading} isError={appointments.isError} isEmpty={upcomingRows.length === 0} emptyText="No upcoming appointments found." errorText="Unable to load your appointments.">
          <DashboardDataTable data={upcomingRows} columns={columns} searchPlaceholder="Filter upcoming appointments..." />
        </QueryState>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Recent Encounter Timeline">
          <QueryState isLoading={encounters.isLoading} isError={encounters.isError} isEmpty={encounterRows.length === 0} emptyText="No recent encounters found." errorText="Unable to load encounter timeline.">
            <div className="space-y-3">
              {encounterRows.slice(0, 5).map((encounter) => (
                <div key={encounter.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{encounter.status_display}</div>
                  <div className="text-slate-500">{formatDateTime(encounter.started_at)}</div>
                </div>
              ))}
            </div>
          </QueryState>
        </SectionCard>

        <SectionCard title="Personal Quick Actions">
          <div className="grid gap-3">
            <Button asChild variant="outline" className="justify-start"><Link href="/appointments"><CalendarClock className="size-4" /> Book Appointment</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/patients"><FileText className="size-4" /> View Medical Record</Link></Button>
          </div>
        </SectionCard>

        <SectionCard title="Active Prescription Details">
          <QueryState isLoading={detailQueries.some((query) => query.isLoading)} isError={detailQueries.some((query) => query.isError)} isEmpty={activePrescriptions.length === 0} emptyText="No active prescriptions found." errorText="Unable to load active prescriptions.">
            <div className="space-y-3">
              {activePrescriptions.slice(0, 5).map((prescription: any) => (
                <div key={prescription.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{prescription.status_display ?? prescription.status}</div>
                  <div className="mt-1 text-slate-500">{prescription.items?.map((item: any) => item.medicine?.name).filter(Boolean).join(', ') || 'Medication details pending'}</div>
                </div>
              ))}
            </div>
          </QueryState>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
