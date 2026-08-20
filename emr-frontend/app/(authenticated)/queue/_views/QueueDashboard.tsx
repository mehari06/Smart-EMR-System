'use client';

import { useState, useMemo } from 'react';
import { useQueue, useQueueStats, useStartConsultation, useCompleteVisit, useMarkLeft } from '@/hooks/useQueue';
import { useAuthStore } from '@/store/useAuthStore';
import { QueueStatusBadge } from '../_components/QueueStatusBadge';
import { TriageLevelBadge } from '../_components/TriageLevelBadge';
import { WaitTimeIndicator } from '../_components/WaitTimeIndicator';
import { AddToQueueModal } from '../_components/AddToQueueModal';
import { TriageModal } from '../_components/TriageModal';
import { AssignDoctorModal } from '../_components/AssignDoctorModal';
import type { PatientQueueItem } from '@/types/queue';
import {
  Users, Clock, AlertTriangle, HeartPulse,
  Stethoscope, CheckCircle2, UserX, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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

function QueueRow({ 
  item, 
  onAction 
}: { 
  item: PatientQueueItem; 
  onAction: (action: string, item: PatientQueueItem) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canTriage = role === 'admin' || role === 'nurse';
  const canAssign = role === 'admin' || role === 'nurse' || role === 'receptionist';
  const canConsult = role === 'admin' || role === 'doctor' || role === 'nurse';

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{item.patient?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{item.patient?.patient_number ?? ''}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <TriageLevelBadge level={item.triage_level} showLabel={false} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600 truncate max-w-[180px]">
          {item.chief_complaint || '—'}
        </p>
      </td>
      <td className="px-4 py-3">
        <WaitTimeIndicator
          waitMinutes={item.wait_time}
          isOverdue={item.is_overdue}
          estimatedWait={item.estimated_wait_minutes}
        />
      </td>
      <td className="px-4 py-3">
        <QueueStatusBadge status={item.current_status} />
      </td>
      <td className="px-4 py-3">
        {item.assigned_doctor_name ? (
          <div>
            <p className="text-sm font-medium text-slate-800">{item.assigned_doctor_name}</p>
            {item.assigned_room && (
              <p className="text-xs text-slate-400">Room: {item.assigned_room}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 justify-end">
          {canTriage && item.current_status === 'W' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
              onClick={() => onAction('triage', item)}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Triage
            </Button>
          )}
          {canTriage && item.current_status === 'T' && (
            <Button
              size="sm"
              variant="default"
              className="gap-1"
              onClick={() => onAction('triage', item)}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Continue
            </Button>
          )}
          {canAssign && ['G', 'A'].includes(item.current_status) && !item.assigned_doctor && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => onAction('assign', item)}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Assign
            </Button>
          )}
          {canConsult && item.current_status === 'A' && item.assigned_doctor && (
            <Button
              size="sm"
              variant="default"
              className="gap-1 bg-green-600 hover:bg-green-700"
              onClick={() => onAction('start-consultation', item)}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Start
            </Button>
          )}
          {canConsult && item.current_status === 'P' && (
            <Button
              size="sm"
              variant="default"
              className="gap-1"
              onClick={() => onAction('complete', item)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          {(item.current_status === 'W' || item.current_status === 'G' || item.current_status === 'A') && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:bg-red-50"
              onClick={() => onAction('left', item)}
            >
              <UserX className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function QueueDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [triageFilter, setTriageFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('triage_level');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [triageItem, setTriageItem] = useState<PatientQueueItem | null>(null);
  const [assignItem, setAssignItem] = useState<PatientQueueItem | null>(null);
  const [completeItem, setCompleteItem] = useState<PatientQueueItem | null>(null);
  const [leftItem, setLeftItem] = useState<PatientQueueItem | null>(null);
  const [leftReason, setLeftReason] = useState('');

  const { data: statsData } = useQueueStats();
    const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading } = useQueue({
    ...(statusFilter ? { current_status: statusFilter } : {}),
    ...(triageFilter ? { triage_level: triageFilter } : {}),
    ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}`,
  });

  const startConsultation = useStartConsultation();
  const completeVisit = useCompleteVisit();
  const markLeft = useMarkLeft();

  const queueItems = data?.results ?? [];

  const filteredItems = useMemo(() => {
    if (!search) return queueItems;
    return queueItems.filter(
      (item) =>
        item.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.patient?.patient_number?.toLowerCase().includes(search.toLowerCase()) ||
        item.chief_complaint?.toLowerCase().includes(search.toLowerCase())
    );
  }, [queueItems, search]);

  const handleAction = (action: string, item: PatientQueueItem) => {
    switch (action) {
      case 'triage':
        setTriageItem(item);
        break;
      case 'assign':
        setAssignItem(item);
        break;
      case 'start-consultation':
        startConsultation.mutate(item.id);
        break;
      case 'complete':
        setCompleteItem(item);
        break;
      case 'left':
        setLeftItem(item);
        break;
    }
  };

  const stats = statsData ?? {
    total_waiting: 0,
    waiting_for_triage: 0,
    triaged_waiting: 0,
    in_consultation: 0,
    emergency_cases: 0,
    by_triage_level: { level_1: 0, level_2: 0, level_3: 0, level_4: 0, level_5: 0, not_triaged: 0 },
    average_wait_minutes: 0,
    long_waiters: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage patient flow, triage, and consultations
          </p>
        </div>
        <AddToQueueModal />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Waiting" value={stats.total_waiting} icon={Users} color="bg-blue-50 text-[#1E90FF]" />
        <StatCard label="Need Triage" value={stats.waiting_for_triage} icon={HeartPulse} color="bg-amber-50 text-amber-600" />
        <StatCard label="In Consultation" value={stats.in_consultation} icon={Stethoscope} color="bg-green-50 text-green-600" />
        <StatCard label="Emergency Cases" value={stats.emergency_cases} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="Avg Wait (min)" value={stats.average_wait_minutes} icon={Clock} color="bg-purple-50 text-purple-600" />
      </div>

      {stats.long_waiters > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 font-medium">
            {stats.long_waiters} patient(s) have exceeded their target wait time!
          </p>
        </div>
      )}

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search patient name, ID, complaint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="W">Waiting for Triage</SelectItem>
              <SelectItem value="T">In Triage</SelectItem>
              <SelectItem value="G">Triaged - Waiting</SelectItem>
              <SelectItem value="A">Assigned to Doctor</SelectItem>
              <SelectItem value="P">In Consultation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={triageFilter} onValueChange={setTriageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
              <SelectItem value="5">Level 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
                           <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  { label: 'Patient', col: 'patient__user__first_name' },
                  { label: 'Level', col: 'triage_level' },
                  { label: 'Complaint', col: 'chief_complaint' },
                  { label: 'Wait Time', col: 'arrival_time' },
                  { label: 'Status', col: 'current_status' },
                  { label: 'Doctor', col: 'assigned_doctor__user__first_name' },
                  { label: 'Actions', col: '' },
                ].map((h) => (
                  <th key={h.label} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Queue is empty</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <QueueRow key={item.id} item={item} onAction={handleAction} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {triageItem && (
        <TriageModal
          queueItem={triageItem}
          open={!!triageItem}
          onOpenChange={(open) => !open && setTriageItem(null)}
        />
      )}

      {assignItem && (
        <AssignDoctorModal
          queueItem={assignItem}
          open={!!assignItem}
          onOpenChange={(open) => !open && setAssignItem(null)}
        />
      )}

      <AlertDialog open={!!completeItem} onOpenChange={(open) => !open && setCompleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this patient's visit as complete. They will be removed from the active queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (completeItem) {
                  completeVisit.mutate({ id: completeItem.id });
                  setCompleteItem(null);
                }
              }}
            >
              Complete Visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!leftItem} onOpenChange={(open) => !open && setLeftItem(null)}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Patient as Left</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Patient: <strong>{leftItem?.patient?.full_name}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for leaving
              </label>
              <Textarea
                value={leftReason}
                onChange={(e) => setLeftReason(e.target.value)}
                placeholder="e.g., Patient left without being seen..."
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeftItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={markLeft.isPending}
              onClick={() => {
                if (leftItem && leftReason) {
                  markLeft.mutate(
                    { id: leftItem.id, reason: leftReason },
                    {
                      onSuccess: () => {
                        setLeftItem(null);
                        setLeftReason('');
                      },
                    }
                  );
                }
              }}
            >
              Mark as Left
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}