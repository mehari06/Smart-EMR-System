'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarPlus, Clock, PhoneCall, UserPlus, UserRoundCheck, Users } from 'lucide-react';
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
import { useDashboardPatients, useDashboardTodayAppointments } from '@/hooks/useDashboardData';
import type { AppointmentListItem } from '@/types/appointments';

export default function ReceptionistDashboard() {
  const appointments = useDashboardTodayAppointments();
  const patients = useDashboardPatients();
  const appointmentRows = appointments.data ?? [];
  const scheduledRows = appointmentRows.filter((appointment) => appointment.status === 'S');
  const checkedInRows = appointmentRows.filter((appointment) => appointment.status === 'I');

  const columns = useMemo<ColumnDef<AppointmentListItem>[]>(() => [
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <SortableHeader label="Time" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.scheduled_at),
    },
    {
      accessorKey: 'patient.full_name',
      header: ({ column }) => <SortableHeader label="Patient" column={column} />,
      cell: ({ row }) => row.original.patient?.full_name ?? 'Walk-in',
    },
    {
      accessorKey: 'patient.phone',
      header: ({ column }) => <SortableHeader label="Phone" column={column} />,
      cell: ({ row }) => row.original.patient?.phone ?? '-',
    },
    {
      accessorKey: 'doctor.full_name',
      header: ({ column }) => <SortableHeader label="Doctor" column={column} />,
      cell: ({ row }) => row.original.doctor?.full_name ?? 'Unassigned',
    },
    {
      accessorKey: 'status_display',
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => <Badge>{row.original.status_display}</Badge>,
    },
  ], []);

  return (
    <DashboardShell title="Receptionist Dashboard" description="Front-desk scheduling, check-in, patient registration, and contact workflow.">
      <StatGrid>
        <StatCard icon={CalendarPlus} label="Today’s Appointments" value={appointments.isLoading ? '...' : appointmentRows.length} tone="teal" />
        <StatCard icon={Clock} label="Awaiting Check-In" value={appointments.isLoading ? '...' : scheduledRows.length} tone="amber" />
        <StatCard icon={UserRoundCheck} label="Checked In" value={appointments.isLoading ? '...' : checkedInRows.length} tone="green" />
        <StatCard icon={Users} label="Registered Patients" value={patients.isLoading ? '...' : patients.data?.count ?? 0} tone="blue" />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Front Desk Queue" description="Sortable, filterable appointment list for today.">
          <QueryState isLoading={appointments.isLoading} isError={appointments.isError} isEmpty={appointmentRows.length === 0} emptyText="No front-desk appointments today." errorText="Unable to load front-desk queue.">
            <DashboardDataTable data={appointmentRows} columns={columns} searchPlaceholder="Filter front-desk queue..." />
          </QueryState>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid gap-3">
            <Button asChild variant="outline" className="justify-start"><Link href="/patients"><UserPlus className="size-4" /> Register Patient</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/appointments"><CalendarPlus className="size-4" /> Schedule Appointment</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/appointments"><PhoneCall className="size-4" /> Contact Patient</Link></Button>
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
