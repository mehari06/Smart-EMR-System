'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pill, Bell, Clock, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const statusConfig = {
  A: { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  D: { label: 'Dispensed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  X: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function MedicationsPage() {
  const user = useAuthStore((s) => s.user);
  const [reminders, setReminders] = useState<Record<number, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['prescriptions', 'patient'],
    queryFn: () => prescriptionsApi.list({}),
    enabled: !!user?.id,
  });

  const prescriptions = data?.results ?? [];
  const activePrescriptions = prescriptions.filter((p: any) => p.status === 'A');

  const toggleReminder = (id: number) => {
    setReminders((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success(reminders[id] ? 'Reminder disabled' : 'Reminder enabled');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Medications</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track your active medications and set reminders
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Pill className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activePrescriptions.length}</p>
              <p className="text-xs font-medium text-slate-500">Active Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {Object.values(reminders).filter(Boolean).length}
              </p>
              <p className="text-xs font-medium text-slate-500">Active Reminders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medications List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Medications</CardTitle>
          <CardDescription>Your current prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500">Unable to load medications.</p>
          ) : activePrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No active medications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePrescriptions.map((prescription: any) => (
                <div key={prescription.id} className="rounded-lg border border-slate-200 p-4">
                  {/* Prescription Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Prescription #{prescription.id}
                      </p>
                      <p className="text-xs text-slate-400">
                        By {prescription.prescribed_by_name} • {new Date(prescription.prescribed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={statusConfig[prescription.status]?.color}>
                        {statusConfig[prescription.status]?.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant={reminders[prescription.id] ? 'default' : 'outline'}
                        className="gap-1.5"
                        onClick={() => toggleReminder(prescription.id)}
                      >
                        {reminders[prescription.id] ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                        {reminders[prescription.id] ? 'Reminder On' : 'Set Reminder'}
                      </Button>
                    </div>
                  </div>

                  {/* Medication Items */}
                  <div className="space-y-2">
                    {prescription.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <Pill className="size-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {item.medicine?.name} {item.medicine?.strength}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.dosage} • {item.frequency} • {item.duration}
                          </p>
                          {item.instructions && (
                            <p className="text-xs text-slate-400 italic mt-0.5">{item.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">Qty: {item.quantity}</p>
                          {reminders[prescription.id] && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Daily reminder
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}