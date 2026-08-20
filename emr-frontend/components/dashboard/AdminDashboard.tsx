'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, CalendarDays, ClipboardList, FileClock, FlaskConical, ShieldAlert, Users, Server, Database, CheckCircle2 } from 'lucide-react';
import { CartesianGrid, Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DashboardDataTable,
  DashboardShell,
  QueryState,
  SectionCard,
  SortableHeader,
  StatCard,
  StatGrid,
  formatDateTime,
  AlertPanel,
} from './DashboardShared';
import {
  useDashboardAuditLogs,
  useDashboardEncounters,
  useDashboardLabOrders,
  useDashboardPatients,
  useDashboardTodayAppointments,
} from '@/hooks/useDashboardData';
import type { AuditLog } from '@/lib/api/dashboard';
import type { AppointmentListItem } from '@/types/appointments';

function registrationChartData(patients: Array<{ registered_at: string }>) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, patients: 0 };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));

  patients.forEach((patient) => {
    const key = patient.registered_at?.slice(0, 10);
    const day = byDate.get(key);
    if (day) day.patients += 1;
  });

  return days.map((day) => ({ ...day, label: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }));
}

export default function AdminDashboard() {
  const patients = useDashboardPatients();
  const appointments = useDashboardTodayAppointments();
  const encounters = useDashboardEncounters({ status: 'O' });
  const labOrders = useDashboardLabOrders({ status: 'P', page_size: 50 });
  const auditLogs = useDashboardAuditLogs();

  const patientRows = patients.data?.results ?? [];
  const appointmentRows = appointments.data ?? [];
  const activeEncounterRows = encounters.data?.results ?? [];
  const pendingLabRows = labOrders.data?.results ?? [];
  const auditRows = auditLogs.data?.results ?? [];

  const chartData = useMemo(() => registrationChartData(patientRows), [patientRows]);

  const staffColumns = useMemo<ColumnDef<AuditLog>[]>(() => [
    {
      accessorKey: 'user_full_name',
      header: ({ column }) => <SortableHeader label="Staff" column={column} />,
      cell: ({ row }) => row.original.user_full_name || row.original.user_email || 'System',
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <SortableHeader label="Action" column={column} />,
      cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
    },
    {
      accessorKey: 'model_name',
      header: ({ column }) => <SortableHeader label="Module" column={column} />,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <SortableHeader label="Time" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.timestamp),
    },
  ], []);

  // Mock critical alerts
  const criticalAlerts = [
    { id: 1, message: 'High CPU Usage on Database Server (95%)', timestamp: new Date().toISOString() },
    { id: 2, message: 'Unsuccessful login attempts threshold exceeded for user: staff_head@example.com', timestamp: new Date(Date.now() - 3600000).toISOString() },
  ];

  const appointmentColumns = useMemo<ColumnDef<AppointmentListItem>[]>(() => [
    {
      accessorKey: 'patient.full_name',
      header: ({ column }) => <SortableHeader label="Patient" column={column} />,
      cell: ({ row }) => row.original.patient?.full_name ?? 'Unassigned',
    },
    {
      accessorKey: 'doctor.full_name',
      header: ({ column }) => <SortableHeader label="Doctor" column={column} />,
      cell: ({ row }) => row.original.doctor?.full_name ?? 'Unassigned',
    },
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <SortableHeader label="Time" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.scheduled_at),
    },
    {
      accessorKey: 'status_display',
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => <Badge>{row.original.status_display}</Badge>,
    },
  ], []);

  return (
    <DashboardShell title="Admin Dashboard" description="Operational view across patients, appointments, encounters, labs, audit activity, and staff workload.">
      <StatGrid>
        <StatCard icon={Users} label="Total Patients" value={patients.isLoading ? '...' : patients.data?.count ?? 0} tone="teal" trend={{ value: 20, isPositive: true }} chartData={[{value: 10}, {value: 15}, {value: 12}, {value: 20}, {value: 25}, {value: 30}]} />
        <StatCard icon={CalendarDays} label="Today's Appointments" value={appointments.isLoading ? '...' : appointmentRows.length} tone="amber" trend={{ value: 15, isPositive: false }} chartData={[{value: 30}, {value: 25}, {value: 28}, {value: 20}, {value: 15}, {value: 10}]} />
        <StatCard icon={Activity} label="Active Encounters" value={encounters.isLoading ? '...' : encounters.data?.count ?? activeEncounterRows.length} tone="purple" trend={{ value: 18, isPositive: true }} chartData={[{value: 5}, {value: 10}, {value: 8}, {value: 15}, {value: 12}, {value: 18}]} />
        <StatCard icon={FlaskConical} label="Pending Lab Orders" value={labOrders.isError ? '-' : labOrders.isLoading ? '...' : labOrders.data?.count ?? pendingLabRows.length} tone="rose" trend={{ value: 12, isPositive: true }} chartData={[{value: 20}, {value: 18}, {value: 25}, {value: 22}, {value: 30}, {value: 28}]} />
        <StatCard icon={ShieldAlert} label="Unread Audit Logs" value={auditLogs.isLoading ? '...' : auditLogs.data?.count ?? auditRows.length} tone="slate" />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="30-Day Patient Registration" description="New patient registrations from the patient API.">
          <QueryState isLoading={patients.isLoading} isError={patients.isError} isEmpty={patientRows.length === 0} emptyText="No patient registrations found." errorText="Unable to load patient registration data.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -16, right: 12, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={5} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="patients" stroke="#0f766e" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </QueryState>
        </SectionCard>

        <SectionCard title="Admin Quick Actions" description="High-frequency administrative workflows.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Button asChild variant="outline" className="justify-start"><Link href="/patients"><Users className="size-4" /> Manage Patients</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/appointments"><CalendarDays className="size-4" /> Review Appointments</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/encounters"><ClipboardList className="size-4" /> Active Encounters</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/dashboard"><FileClock className="size-4" /> Audit Review</Link></Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="System Health" description="Status of critical EMR infrastructure.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900"><Server className="size-4 text-emerald-600 dark:text-emerald-400" /></div>
                <div><p className="text-sm font-medium">Application API</p><p className="text-xs text-slate-500">Uptime: 99.9%</p></div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="mr-1 size-3" /> Operational</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900"><Database className="size-4 text-emerald-600 dark:text-emerald-400" /></div>
                <div><p className="text-sm font-medium">Database (PostgreSQL)</p><p className="text-xs text-slate-500">Last backup: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="mr-1 size-3" /> Healthy</Badge>
            </div>
          </div>
        </SectionCard>
        
        <div className="space-y-4">
          <AlertPanel alerts={criticalAlerts} />
        </div>
      </div>

      <SectionCard title="Today’s Staff Activity" description="Sortable, filterable audit activity table.">
        <QueryState isLoading={auditLogs.isLoading} isError={auditLogs.isError} isEmpty={auditRows.length === 0} emptyText="No recent staff activity found." errorText="Unable to load audit activity.">
          <DashboardDataTable data={auditRows} columns={staffColumns} searchPlaceholder="Filter staff activity..." />
        </QueryState>
      </SectionCard>

      <SectionCard title="Today’s Appointment Flow" description="Current schedule with patient, doctor, time, and status.">
        <QueryState isLoading={appointments.isLoading} isError={appointments.isError} isEmpty={appointmentRows.length === 0} emptyText="No appointments scheduled today." errorText="Unable to load today’s appointments.">
          <DashboardDataTable data={appointmentRows} columns={appointmentColumns} searchPlaceholder="Filter appointments..." />
        </QueryState>
      </SectionCard>
    </DashboardShell>
  );
}
