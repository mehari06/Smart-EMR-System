'use client';

import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { useAppointments, useCancelAppointment, useRescheduleAppointment } from '@/hooks/useAppointments';
import { useAuthStore } from '@/store/useAuthStore';
import { StatusBadge } from '../_components/StatusBadge';
import type { AppointmentListItem } from '@/types/appointments';

import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CalendarDays, Clock, User, Stethoscope, XCircle, CalendarClock, CheckCircle2,
} from 'lucide-react';

// ── Appointment Card ──────────────────────────────────────────────────────
function AppointmentCard({
  appt,
  onCancel,
  canCancel,
}: {
  appt: AppointmentListItem;
  onCancel?: () => void;
  canCancel?: boolean;
}) {
  const date = new Date(appt.scheduled_at);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2.5 bg-blue-50">
            <Stethoscope className="h-5 w-5 text-[#1E90FF]" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{appt.reason}</p>
            <p className="text-xs text-slate-400 mt-0.5">Appointment #{appt.id}</p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span>{format(date, 'EEEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span>{format(date, 'h:mm a')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span>{appt.doctor?.full_name ?? 'Provider TBD'}</span>
        </div>
        {appt.doctor?.specialization && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Stethoscope className="h-4 w-4 text-slate-300 flex-shrink-0" />
            <span>{appt.doctor.specialization}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {canCancel && onCancel && (
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
            onClick={onCancel}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel Appointment
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 bg-white rounded-xl border border-slate-100">
      <CalendarDays className="h-12 w-12 text-slate-200 mb-3" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

// ── Main Patient View ─────────────────────────────────────────────────────
export default function PatientAppointments() {
  const { data, isLoading } = useAppointments();
  const cancelMut = useCancelAppointment();
  const [cancelId, setCancelId] = useState<number | null>(null);

  const all = data?.results ?? [];

  const upcoming = all.filter(a =>
    (a.status === 'S' || a.status === 'I') && !isPast(new Date(a.scheduled_at))
  );
  const past = all.filter(a =>
    a.status === 'C' || a.status === 'X' || a.status === 'N' ||
    (a.status === 'S' && isPast(new Date(a.scheduled_at)))
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 bg-slate-100 rounded w-48" />
        <div className="h-5 bg-slate-100 rounded w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 rounded w-36" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and manage your upcoming and past appointments</p>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[#1E90FF]" />
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
          {upcoming.length > 0 && (
            <span className="ml-1 rounded-full bg-blue-100 text-[#1E90FF] text-xs font-bold px-2.5 py-0.5">
              {upcoming.length}
            </span>
          )}
        </div>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
        ) : upcoming.length === 0 ? (
          <EmptyState label="No upcoming appointments" />
        ) : (
          upcoming.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              canCancel={appt.status === 'S'}
              onCancel={() => setCancelId(appt.id)}
            />
          ))
        )}
      </section>

      {/* Past */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-600">Past Appointments</h2>
          {past.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-0.5">
              {past.length}
            </span>
          )}
        </div>

        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
        ) : past.length === 0 ? (
          <EmptyState label="No past appointments" />
        ) : (
          past.map(appt => (
            <AppointmentCard key={appt.id} appt={appt} canCancel={false} />
          ))
        )}
      </section>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? A staff member will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (cancelId) cancelMut.mutate({ id: cancelId });
                setCancelId(null);
              }}
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
