'use client';
import { apiClient } from '@/lib/api/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useTriageAppointment } from '@/hooks/useAppointments';
import type { Staff } from '@/lib/api/core';
import type { PaginatedResponse } from '@/types/api';
import type { TriageData, TriageLevel } from '@/types/appointments';
import { TRIAGE_LEVEL_LABELS } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { HeartPulse, Stethoscope } from 'lucide-react';
import type { AppointmentListItem } from '@/types/appointments';

const triageSchema = z.object({
  chief_complaint: z.string().min(3, 'Chief complaint is required'),
  triage_level: z.coerce.number().min(1).max(5),
  triage_notes: z.string().optional(),
  pain_score: z.coerce.number().min(0).max(10).optional(),
  temperature: z.coerce.number().optional(),
  heart_rate: z.coerce.number().optional(),
  systolic_bp: z.coerce.number().optional(),
  diastolic_bp: z.coerce.number().optional(),
  oxygen_saturation: z.coerce.number().optional(),
  doctor_id: z.coerce.number().min(1, 'Please select a doctor'),
});

type TriageFormValues = z.infer<typeof triageSchema>;

interface TriagePanelProps {
  appointments: AppointmentListItem[];
  isLoading: boolean;
}

export function TriagePanel({ appointments, isLoading }: TriagePanelProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentListItem | null>(null);
  const [open, setOpen] = useState(false);
  const triageMut = useTriageAppointment();

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => apiClient.get<PaginatedResponse<Staff>>('/core/staff', { params: { page_size: 200 } }).then((response) => response.data),
  });

  const doctors: Staff[] = (staffData?.results ?? []).filter(
    (staff: Staff) => staff.user?.role === 'doctor'
  );

  const form = useForm<TriageFormValues>({
    resolver: zodResolver(triageSchema),
    defaultValues: { chief_complaint: '', triage_level: 3, triage_notes: '', pain_score: 0, doctor_id: 0 },
  });

  const onSubmit = (values: TriageFormValues) => {
    if (!selectedAppointment) return;
    const data: TriageData = {
      ...values,
      triage_level: values.triage_level as TriageLevel,
    };

    triageMut.mutate({ id: selectedAppointment.id, data }, {
      onSuccess: () => { setOpen(false); setSelectedAppointment(null); form.reset(); },
    });
  };

  const waitingForTriage = appointments.filter(a => a.status === 'S' || a.status === 'I');

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
    ))}</div>;
  }

  return (
    <div className="space-y-4">
      {waitingForTriage.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Stethoscope className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No patients waiting for triage</p>
        </div>
      ) : (
        waitingForTriage.map(appt => (
          <Card key={appt.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{appt.patient?.full_name ?? 'Unknown'}</p>
                <p className="text-sm text-slate-500">{appt.reason}</p>
              </div>
              <Dialog open={open && selectedAppointment?.id === appt.id} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedAppointment(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setSelectedAppointment(appt); setOpen(true); }}>
                    <HeartPulse className="h-4 w-4 mr-1" /> Triage
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Triage Assessment</DialogTitle></DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="chief_complaint" render={({ field }) => (
                        <FormItem><FormLabel>Chief Complaint</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="triage_level" render={({ field }) => (
                          <FormItem><FormLabel>Triage Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {([1,2,3,4,5] as TriageLevel[]).map(l => (
                                  <SelectItem key={l} value={String(l)}>{TRIAGE_LEVEL_LABELS[l]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="pain_score" render={({ field }) => (
                          <FormItem><FormLabel>Pain (0-10)</FormLabel>
                            <FormControl><Input type="number" min={0} max={10} {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="temperature" render={({ field }) => (
                          <FormItem><FormLabel>Temp (°C)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="heart_rate" render={({ field }) => (
                          <FormItem><FormLabel>HR</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="oxygen_saturation" render={({ field }) => (
                          <FormItem><FormLabel>SpO2 (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="doctor_id" render={({ field }) => (
                        <FormItem><FormLabel>Assign Doctor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                            <SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                            <SelectContent>
                              {doctors.map(doc => (
                                <SelectItem key={doc.id} value={String(doc.id)}>
                                  Dr. {doc.user.first_name} {doc.user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="triage_notes" render={({ field }) => (
                        <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                      )} />
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={triageMut.isPending}>
                          {triageMut.isPending ? 'Saving...' : 'Complete Triage'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
