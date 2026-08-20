'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, CalendarDays, ClipboardEdit, FileText, FlaskConical, Pill, RadioTower, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
import {
  useDashboardAppointments,
  useDashboardEncounters,
  useDashboardLabOrders,
  useDashboardPrescriptions,
  useDashboardRadiologyOrders,
} from '@/hooks/useDashboardData';
import { clinicalApi } from '@/lib/api/clinical';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppointmentListItem } from '@/types/appointments';
import type { Encounter, VitalSign } from '@/types/clinical';

function isBlankHtml(value?: string) {
  return !value || value.replace(/<[^>]*>/g, '').trim().length === 0;
}

export default function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const doctorId = user?.id;
  const enabled = !!doctorId;

  const appointments = useDashboardAppointments({ doctor: doctorId ?? 0, page_size: 50 }, enabled);
  const activeEncounters = useDashboardEncounters({ doctor: doctorId, status: 'O' }, enabled);
  const labOrders = useDashboardLabOrders({ ordered_by: doctorId ?? 0, page_size: 50 }, enabled);
  const prescriptions = useDashboardPrescriptions({ prescribed_by: doctorId ?? 0, page_size: 50 }, enabled);
  const radiologyOrders = useDashboardRadiologyOrders({ ordered_by: doctorId ?? 0, page_size: 50 }, enabled);

  const appointmentRows = appointments.data?.results ?? [];
  const encounterRows = activeEncounters.data?.results ?? [];
  const encounterDetails = useQueries({
    queries: encounterRows.slice(0, 5).map((encounter) => ({
      queryKey: ['dashboard', 'doctor', 'encounterDetail', encounter.id],
      queryFn: () => clinicalApi.getEncounter(encounter.id),
      enabled,
      staleTime: 1000 * 60,
    })),
  });

  const detailedEncounters = encounterDetails.map((query) => query.data).filter(Boolean) as Encounter[];
  const pendingSoap = detailedEncounters.filter((encounter) => isBlankHtml(encounter.clinical_notes)).length;
  const myPatientsToday = new Set(appointmentRows.map((appointment) => appointment.patient?.id).filter(Boolean)).size;
  const vitals = detailedEncounters
    .map((encounter) => encounter.vitalsign)
    .filter(Boolean) as VitalSign[];

  const vitalsTimeline = vitals.map((vital) => ({
    time: formatDateTime(vital.recorded_at),
    pulse: vital.pulse_rate,
    spo2: vital.oxygen_saturation,
    temp: vital.temperature,
  }));

  const appointmentColumns = useMemo<ColumnDef<AppointmentListItem>[]>(() => [
    {
      accessorKey: 'patient.full_name',
      header: ({ column }) => <SortableHeader label="Patient" column={column} />,
      cell: ({ row }) => row.original.patient?.full_name ?? 'Unassigned',
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
    <DashboardShell title="Doctor Dashboard" description="Focused view of assigned appointments, open encounters, notes, orders, and recent vitals.">
      <StatGrid>
        <StatCard icon={Users} label="My Patients Today" value={appointments.isLoading ? '...' : myPatientsToday} tone="indigo" trend={{ value: 10, isPositive: true }} chartData={[{value: 20}, {value: 30}, {value: 25}, {value: 40}, {value: 35}, {value: 45}]} />
        <StatCard icon={CalendarDays} label="My Appointments" value={appointments.isLoading ? '...' : appointments.data?.count ?? appointmentRows.length} tone="blue" trend={{ value: 5, isPositive: false }} chartData={[{value: 15}, {value: 12}, {value: 18}, {value: 15}, {value: 10}, {value: 8}]} />
        <StatCard icon={ClipboardEdit} label="Pending SOAP Notes" value={encounterDetails.some((q) => q.isLoading) ? '...' : pendingSoap} tone="amber" trend={{ value: 2, isPositive: false }} chartData={[{value: 5}, {value: 6}, {value: 4}, {value: 3}, {value: 5}, {value: 2}]} />
        <StatCard icon={Activity} label="Active Encounters" value={activeEncounters.isLoading ? '...' : activeEncounters.data?.count ?? encounterRows.length} tone="green" trend={{ value: 15, isPositive: true }} chartData={[{value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}, {value: 20}]} />
        <StatCard icon={FlaskConical} label="Lab Orders" value={labOrders.isError ? '-' : labOrders.isLoading ? '...' : labOrders.data?.count ?? 0} tone="rose" />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <SectionCard title="Quick Actions">
          <div className="flex flex-col gap-3">
            <Button asChild className="justify-start"><Link href="/patients"><Users className="size-4 mr-2" /> Quick-Start Encounter</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/encounters"><FileText className="size-4 mr-2" /> Continue Clinical Documentation</Link></Button>
          </div>
        </SectionCard>
        <SectionCard title="Active Orders" description="Summary of your pending clinical orders.">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={Pill} label="Prescriptions" value={prescriptions.isLoading ? '...' : prescriptions.data?.count ?? 0} tone="purple" />
            <StatCard icon={RadioTower} label="Radiology Orders" value={radiologyOrders.isLoading ? '...' : radiologyOrders.data?.count ?? 0} tone="indigo" />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="My Appointment Queue" description="Sortable, filterable, paginated schedule for the logged-in doctor.">
          <QueryState isLoading={appointments.isLoading} isError={appointments.isError} isEmpty={appointmentRows.length === 0} emptyText="No appointments assigned." errorText="Unable to load doctor appointments.">
            <DashboardDataTable data={appointmentRows} columns={appointmentColumns} searchPlaceholder="Filter my appointments..." />
          </QueryState>
        </SectionCard>

        <SectionCard title="Recent Vitals Timeline" description="Latest vitals from loaded active encounters.">
          <QueryState isLoading={encounterDetails.some((query) => query.isLoading)} isError={encounterDetails.some((query) => query.isError)} isEmpty={vitalsTimeline.length === 0} emptyText="No recent vitals are available for active encounters." errorText="Unable to load recent vitals.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsTimeline} margin={{ left: -16, right: 12, top: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pulse" stroke="#0f766e" strokeWidth={2} />
                  <Line type="monotone" dataKey="spo2" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </QueryState>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
