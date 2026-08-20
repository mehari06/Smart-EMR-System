'use client';

import { useState, useMemo } from 'react';
import { format, addHours } from 'date-fns';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';

import {
  useAppointments,
  useTodayAppointments,
  useCancelAppointment,
  useCheckinAppointment,
} from '@/hooks/useAppointments';
import { StatusBadge } from '../_components/StatusBadge';
import { CreateAppointmentModal } from '../_components/CreateAppointmentModal';
import type { AppointmentListItem, CalendarEvent } from '@/types/appointments';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  LayoutList, CalendarDays, Users, UserCheck, Clock, Activity,
  Search, ChevronLeft, ChevronRight, UserX, LogIn, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ── Calendar localizer ───────────────────────────────────────────────────
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// ── Status filter options ─────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'S', label: 'Scheduled' },
  { value: 'I', label: 'Checked In' },
  { value: 'G', label: 'Triaged' },
  { value: 'C', label: 'Completed' },
  { value: 'X', label: 'Cancelled' },
  { value: 'N', label: 'No Show' },
];

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminAppointments() {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [calView, setCalView] = useState<string>(Views.WEEK);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'checkin'; id: number;
  } | null>(null);
  const [sortColumn, setSortColumn] = useState('scheduled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const params: Record<string, string | number | undefined> = {
    page,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}`,
  };

    const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading } = useAppointments(params);
  const { data: todayAppts } = useTodayAppointments();
  const cancelMut = useCancelAppointment();
  const checkinMut = useCheckinAppointment();

  const appointments = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 10);

  // Stats
  const todayList = todayAppts ?? [];
  const stats = {
    total: todayList.length,
    scheduled: todayList.filter(a => a.status === 'S').length,
    checkedIn: todayList.filter(a => a.status === 'I').length,
    triaged: todayList.filter(a => a.status === 'G').length,
    completed: todayList.filter(a => a.status === 'C').length,
  };

  // Calendar events
  const calEvents: CalendarEvent[] = useMemo(() =>
    appointments.map(a => ({
      id: a.id,
      title: `${a.patient?.full_name ?? 'Patient'} → Dr. ${a.doctor?.full_name ?? 'Unassigned'}`,
      start: new Date(a.scheduled_at),
      end: addHours(new Date(a.scheduled_at), 1),
      resource: a,
    })), [appointments]
  );

  // Table columns
  const columns: ColumnDef<AppointmentListItem>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-500">#{row.original.id}</span>,
      size: 60,
    },
    {
      id: 'patient',
      header: 'Patient',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900 text-sm">{row.original.patient?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{row.original.patient?.patient_number ?? ''}</p>
        </div>
      ),
    },
    {
      id: 'doctor',
      header: 'Provider',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-800 text-sm">{row.original.doctor?.full_name ?? 'Unassigned'}</p>
          <p className="text-xs text-slate-400">{row.original.doctor?.specialization ?? ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'scheduled_at',
      header: 'Date & Time',
      cell: ({ row }) => {
        const d = new Date(row.original.scheduled_at);
        return (
          <div>
            <p className="text-sm font-medium text-slate-800">{format(d, 'MMM d, yyyy')}</p>
            <p className="text-xs text-slate-400">{format(d, 'h:mm a')}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate max-w-[180px] block">
          {row.original.reason}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="flex gap-1.5 justify-end">
            {appt.status === 'S' && (
              <button
                onClick={() => setConfirmAction({ type: 'checkin', id: appt.id })}
                title="Check In"
                className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
              </button>
            )}
            {(appt.status === 'S' || appt.status === 'I') && (
              <button
                onClick={() => setConfirmAction({ type: 'cancel', id: appt.id })}
                title="Cancel"
                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: appointments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const calEventStyleGetter = (event: CalendarEvent) => {
    const statusColors: Record<string, string> = {
      S: '#1E90FF',
      I: '#f59e0b',
      G: '#8b5cf6',
      C: '#22c55e',
      X: '#ef4444',
      N: '#94a3b8',
    };
    const bg = statusColors[event.resource.status] ?? '#1E90FF';
    return { style: { backgroundColor: bg, borderRadius: '6px', border: 'none', color: 'white', fontSize: '12px' } };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all patient appointments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${view === 'table' ? 'bg-[#1E90FF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutList className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-[#1E90FF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
          <CreateAppointmentModal />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Appointments" value={stats.total} icon={CalendarDays} color="bg-blue-50 text-[#1E90FF]" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={Clock} color="bg-slate-50 text-slate-600" />
        <StatCard label="Checked In" value={stats.checkedIn} icon={UserCheck} color="bg-amber-50 text-amber-600" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-green-50 text-green-600" />
      </div>

      {/* Content */}
      {view === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search patient, doctor, reason..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-slate-100 bg-slate-50">
                    {hg.headers.map((h) => (
                      <th 
                        key={h.id} 
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:bg-slate-100"
                        onClick={() => {
                          const columnMap: Record<string, string> = {
                            'ID': 'id',
                            'Patient': 'patient__user__first_name',
                            'Provider': 'doctor__user__first_name',
                            'Date & Time': 'scheduled_at',
                            'Reason': 'reason',
                            'Status': 'status',
                          };
                          const column = columnMap[h.column.columnDef.header as string];
                          if (column) handleSort(column);
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sortColumn === (() => {
                            const columnMap: Record<string, string> = {
                              'ID': 'id',
                              'Patient': 'patient__user__first_name',
                              'Provider': 'doctor__user__first_name',
                              'Date & Time': 'scheduled_at',
                              'Reason': 'reason',
                              'Status': 'status',
                            };
                            return columnMap[h.column.columnDef.header as string];
                          })() && (
                            <span className="text-xs">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">No appointments found</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {totalCount > 0 ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, totalCount)} of ${totalCount}` : '0 results'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cal toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {[Views.DAY, Views.WEEK, Views.MONTH].map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${calView === v ? 'bg-[#1E90FF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
              {Object.entries({ Scheduled: '#1E90FF', 'Checked In': '#f59e0b', Triaged: '#8b5cf6', Completed: '#22c55e', Cancelled: '#ef4444' }).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4" style={{ height: 680 }}>
            {isLoading ? (
              <div className="h-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <BigCalendar
                localizer={localizer}
                events={calEvents}
                startAccessor="start"
                endAccessor="end"
                view={calView as any}
                onView={setCalView as any}
                eventPropGetter={calEventStyleGetter as any}
                style={{ height: '100%' }}
                popup
              />
            )}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'cancel' ? 'Cancel Appointment?' : 'Check In Patient?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'cancel'
                ? 'This will mark the appointment as cancelled. This cannot be undone.'
                : 'This will mark the patient as checked in for their appointment.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1E90FF] hover:bg-[#1a7ae0]'}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === 'cancel') {
                  cancelMut.mutate({ id: confirmAction.id });
                } else {
                  checkinMut.mutate(confirmAction.id);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === 'cancel' ? 'Cancel Appointment' : 'Confirm Check-In'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
