'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ClipboardList, HeartPulse } from 'lucide-react';
import { clinicalApi } from '@/lib/api/clinical';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VitalsForm } from '@/components/encounters/VitalsForm';

export default function VitalsPage() {
  const [selectedEncounter, setSelectedEncounter] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterVitals, setFilterVitals] = useState('all');
  
    const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['encounters', 'open'],
    queryFn: () => clinicalApi.listEncounters({ status: 'O' }),
  });

  const encounters = data?.results ?? [];
  const encountersWithVitals = encounters.filter((e) => e.vitalsign);
  const encountersWithoutVitals = encounters.filter((e) => !e.vitalsign);

  const openVitalsModal = (encounterId: number) => {
    setSelectedEncounter(encounterId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vital Signs Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">Record and monitor patient vitals for active encounters.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{encountersWithoutVitals.length}</p>
              <p className="text-xs font-medium text-slate-500">Pending Vitals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <HeartPulse className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{encountersWithVitals.length}</p>
              <p className="text-xs font-medium text-slate-500">Vitals Recorded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Encounters</CardTitle>
          <CardDescription>Patients currently waiting or being seen. Record their vitals here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : isError ? (
            <p className="rounded-lg border p-4 text-sm text-destructive">Unable to load active encounters.</p>
          ) : encounters.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <Activity className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No active encounters</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow>
                    <TableHead>
                      <span className="cursor-pointer" onClick={() => handleSort('patient__user__first_name')}>
                        Patient {sortColumn === 'patient__user__first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="cursor-pointer" onClick={() => handleSort('doctor__user__first_name')}>
                        Doctor {sortColumn === 'doctor__user__first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </span>
                    </TableHead>
                    <TableHead>Vitals Status</TableHead>
                    <TableHead>
                      <span className="cursor-pointer" onClick={() => handleSort('started_at')}>
                        Started At {sortColumn === 'started_at' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                        {encounter.vitalsign ? (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Recorded</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {new Date(encounter.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant={encounter.vitalsign ? 'ghost' : 'default'} onClick={() => openVitalsModal(encounter.id)}>
                          <HeartPulse className="size-3.5 mr-2" />
                          {encounter.vitalsign ? 'Edit Vitals' : 'Record Vitals'}
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

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) { setSelectedEncounter(null); refetch(); } }}>
        <DialogContent className="w-full max-w-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
          </DialogHeader>
          {selectedEncounter && (
            <VitalsForm encounterId={selectedEncounter} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
