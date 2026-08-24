'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarClock, ClipboardList, Stethoscope } from 'lucide-react';
import { clinicalApi } from '@/lib/api/clinical';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewEncounterDialog } from '@/components/encounters/NewEncounterDialog';
import { useAuthStore } from '@/store/useAuthStore';

export default function EncountersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const user = useAuthStore((s) => s.user);
  const [sortColumn, setSortColumn] = useState('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Doctors should only see their own encounters
  const isDoctor = user?.role === 'doctor';
  const staffProfileId = user?.staff_profile_id;


  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['encounters', statusFilter, sortColumn, sortOrder, isDoctor ? staffProfileId : 'all'],
    queryFn: () => clinicalApi.listEncounters({ 
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(isDoctor && staffProfileId ? { doctor: staffProfileId } : {}),
      ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}`,
    }),
  });
  const encounters = data?.results ?? [];
  const canCreate = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'nurse';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clinical Encounters</h1>
          <p className="mt-1 text-sm text-slate-500">Resume open consultations and review completed visits.</p>
        </div>
        {canCreate && <NewEncounterDialog />}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Encounters" value={encounters.length} icon={ClipboardList} />
        <StatCard label="Open" value={encounters.filter((item) => item.status === 'O').length} icon={Activity} />
        <StatCard label="Completed" value={encounters.filter((item) => item.status === 'C').length} icon={Stethoscope} />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="space-y-1">
            <CardTitle>Encounter Worklist</CardTitle>
            <CardDescription>Open an encounter to continue summary, vitals, diagnoses, SOAP, and discharge documentation.</CardDescription>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="O">Open</SelectItem>
                <SelectItem value="C">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : isError ? (
            <p className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">Unable to load encounters.</p>
          ) : encounters.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <ClipboardList className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No encounters yet</p>
              <p className="mt-1 text-sm text-slate-500">Start from a scheduled appointment to create a consultation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow>
                    <TableHead>
                      <span className="cursor-pointer hover:text-slate-700" onClick={() => handleSort('patient__user__first_name')}>
                        Patient
                        {sortColumn === 'patient__user__first_name' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="cursor-pointer hover:text-slate-700" onClick={() => handleSort('doctor__user__first_name')}>
                        Doctor
                        {sortColumn === 'doctor__user__first_name' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="cursor-pointer hover:text-slate-700" onClick={() => handleSort('status')}>
                        Status
                        {sortColumn === 'status' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="cursor-pointer hover:text-slate-700" onClick={() => handleSort('started_at')}>
                        Started
                        {sortColumn === 'started_at' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encounters.map((encounter) => (
                    <TableRow key={encounter.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{encounter.patient?.full_name ?? 'Patient'}</p>
                          <p className="text-xs text-slate-500">{encounter.patient?.patient_number ?? ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>{encounter.doctor?.full_name ?? 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant={encounter.status === 'O' ? 'default' : 'secondary'}>{encounter.status_display}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CalendarClock className="size-4 text-slate-400" />
                          {new Date(encounter.started_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant={encounter.status === 'O' ? 'default' : 'outline'}>
                          <Link href={`/patients/${encounter.patient.id}/encounter/${encounter.id}/summary`}>
                            {encounter.status === 'O' ? 'Resume' : 'Review'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4 pt-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}