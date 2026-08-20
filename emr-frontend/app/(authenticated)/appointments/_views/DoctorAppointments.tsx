'use client';

import { useState, useMemo } from 'react';
import { format, addHours } from 'date-fns';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAppointments, useCheckinAppointment } from '@/hooks/useAppointments';
import { useStartEncounter } from '@/hooks/useEncounterMutations';
import { useAuthStore } from '@/store/useAuthStore';
import { StatusBadge } from '../_components/StatusBadge';
import type { AppointmentListItem, CalendarEvent } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays, LayoutList, Clock, CheckCircle2, LogIn, UserCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
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

export default function DoctorAppointments() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentListItem | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [calView, setCalView] = useState<string>(Views.WEEK);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('scheduled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const staffProfileId = user?.staff_profile_id;
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading } = useAppointments({
    page,
    page_size: 10,
    ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}`,
  });
  const checkinMut = useCheckinAppointment();
  const startEncounterMut = useStartEncounter();

  const appointments = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 10);

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'S').length,
    checkedIn: appointments.filter(a => a.status === 'I').length,
    triaged: appointments.filter(a => a.status === 'G').length,
    completed: appointments.filter(a => a.status === 'C').length,
  };

  const calEvents: CalendarEvent[] = useMemo(() =>
    appointments.map(a => ({
      id: a.id,
      title: `${a.patient?.full_name ?? 'Patient'} — ${a.reason}`,
      start: new Date(a.scheduled_at),
      end: addHours(new Date(a.scheduled_at), 1),
      resource: a,
    })), [appointments]
  );

    const eventStyleGetter = (event: CalendarEvent) => {
    const colors: Record<string, string> = {
      S: '#1E90FF', I: '#f59e0b', G: '#8b5cf6', C: '#22c55e', X: '#ef4444', N: '#94a3b8',
    };
    return {
      style: {
        backgroundColor: colors[event.resource.status] ?? '#1E90FF',
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
        cursor: 'pointer',
      }
    };
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome, {user?.first_name ?? 'Doctor'} — here are your assigned appointments
          </p>
        </div>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={CalendarDays} color="bg-blue-50 text-[#1E90FF]" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={Clock} color="bg-slate-50 text-slate-600" />
        <StatCard label="Checked In" value={stats.checkedIn} icon={UserCheck} color="bg-amber-50 text-amber-600" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-green-50 text-green-600" />
      </div>

      {view === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  { label: 'Patient', col: 'patient__user__first_name' },
                  { label: 'Scheduled', col: 'scheduled_at' },
                  { label: 'Reason', col: 'reason' },
                  { label: 'Status', col: 'status' },
                  { label: 'Action', col: '' },
                ].map(h => (
                  <th 
                    key={h.label} 
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h.col ? (
                      <span 
                        className="cursor-pointer hover:text-slate-700"
                        onClick={() => handleSort(h.col)}
                      >
                        {h.label}
                        {sortColumn === h.col && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    ) : (
                      h.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No appointments assigned to you</p>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900 text-sm">{appt.patient?.full_name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{appt.patient?.patient_number ?? ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-800">{format(new Date(appt.scheduled_at), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-slate-400">{format(new Date(appt.scheduled_at), 'h:mm a')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-600 max-w-[200px] truncate">{appt.reason}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-4">
                      {appt.status === 'S' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => router.push(`/patients/${appt.patient?.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => checkinMut.mutate(appt.id)}
                            disabled={checkinMut.isPending}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Check In
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5"
                            onClick={() => startEncounterMut.mutate({ patientId: appt.patient!.id, doctorId: appt.doctor?.id, appointmentId: appt.id, reason: appt.reason })}
                            disabled={startEncounterMut.isPending}
                          >
                            Start Encounter
                          </Button>
                        </div>
                      )}
                      {(appt.status === 'I' || appt.status === 'G') && (
                        <div className="flex gap-2 items-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => router.push(`/patients/${appt.patient?.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                          <Badge className={appt.status === 'G' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                            {appt.status === 'G' ? 'Triaged' : 'In Progress'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1.5"
                            onClick={() => startEncounterMut.mutate({ patientId: appt.patient!.id, doctorId: appt.doctor?.id, appointmentId: appt.id, reason: appt.reason })}
                            disabled={startEncounterMut.isPending}
                          >
                            Resume Encounter
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {totalCount > 0 ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, totalCount)} of ${totalCount}` : '0 results'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Calendar */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
          </div>
          <div className="p-4" style={{ height: 620 }}>
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
                eventPropGetter={eventStyleGetter as any}
                onSelectEvent={(event: CalendarEvent) => {
                  setSelectedEvent(event.resource);
                  setEventDetailsOpen(true);
                }}
                style={{ height: '100%' }}
                popup
              />
            )}
          </div>
        </div>
      )}
            {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Appointment Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500 uppercase font-semibold">Patient</p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {selectedEvent.patient?.full_name ?? 'N/A'}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedEvent.patient?.patient_number}
                </p>
                {selectedEvent.patient?.phone && (
                  <p className="text-sm text-slate-500">
                    📞 {selectedEvent.patient.phone}
                  </p>
                )}
              </div>

              {/* Appointment Info */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Date & Time</span>
                  <span className="text-sm font-medium text-slate-900">
                    {format(new Date(selectedEvent.scheduled_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Reason</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedEvent.reason}
                  </span>
                </div>
                {selectedEvent.doctor && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Doctor</span>
                    <span className="text-sm font-medium text-slate-900">
                      {selectedEvent.doctor.full_name}
                    </span>
                  </div>
                )}
                {selectedEvent.triage_level && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Triage Level</span>
                    <span className="text-sm font-medium text-slate-900">
                      Level {selectedEvent.triage_level}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEventDetailsOpen(false);
                    router.push(`/patients/${selectedEvent.patient?.id}`);
                  }}
                >
                  View Patient
                </Button>
                {selectedEvent.status === 'S' && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setEventDetailsOpen(false);
                      startEncounterMut.mutate({
                        patientId: selectedEvent.patient!.id,
                        doctorId: selectedEvent.doctor?.id,
                        appointmentId: selectedEvent.id,
                        reason: selectedEvent.reason,
                      });
                    }}
                  >
                    Start Encounter
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}