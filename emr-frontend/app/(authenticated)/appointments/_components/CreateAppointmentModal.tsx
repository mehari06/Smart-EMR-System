'use client';
import { coreApi } from '@/lib/api/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

import { useCreateAppointment } from '@/hooks/useAppointments';
// import { useQuery } from '@tanstack/react-query';
import { PatientSearchSelect } from './PatientSearchSelect';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  patient: z.number().min(1, 'Select a patient'),
  department: z.string().min(1, 'Select a department'),

  doctor: z.number().optional(),  // ADD THIS
  triage_nurse: z.string().optional(), 
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  reason: z.string().min(3, ' must be at least 3 characters'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateAppointmentModal() {
  const queryClient = useQueryClient();
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => coreApi.getDepartments(),
  });
  const departments = deptData?.results ?? [];

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'nurses'],
    queryFn: () => coreApi.getStaff(),
  });
  const nurses = (staffData?.results ?? []).filter(s => s.user.role === 'nurse');
  const doctors = (staffData?.results ?? []).filter(s => s.user.role === 'doctor');
  const [open, setOpen] = useState(false);
  const createMut = useCreateAppointment();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient: 0,
      
      department: '',
       doctor: 0,
      triage_nurse: '',
      date: '',
      time: '',
      reason: '',
      notes: '',
    },
  });

  const selectedPatientId = watch('patient');

  const onSubmit = async (values: FormValues) => {
    const scheduled_at = `${values.date}T${values.time}:00`;
    await createMut.mutateAsync({
      patient: values.patient,
      department: Number(values.department),
      ...(values.doctor ? { doctor: Number(values.doctor) } : {}),
      ...(values.triage_nurse ? { triage_nurse: Number(values.triage_nurse) } : {}),
      scheduled_at,
      reason: values.reason,
      notes: values.notes ?? '',
    });
    reset();
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  // Today formatted as YYYY-MM-DD for min date
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#1E90FF] hover:bg-[#1a7ae0] text-white">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Schedule New Appointment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient <span className="text-red-500">*</span>
            </label>
            <PatientSearchSelect
              value={selectedPatientId}
              onChange={(patientId) => setValue('patient', patientId ?? 0, { shouldValidate: true })}
              error={errors.patient?.message}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              {...register('department')}
              
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
            >
              <option value="">— Select Department —</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>
            )}
          </div>
                    {/* Doctor (Optional - for follow-up visits) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor <span className="text-slate-400">(Optional - for follow-up)</span>
            </label>
            <select
              {...register('doctor', { valueAsNumber: true })}
              required={false}

              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
            
            >
              <option value="">— Select Doctor (if known) —</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.first_name} {d.user.last_name}
                  {d.specialization && ` (${d.specialization})`}
                </option>
              ))}
            </select>
          </div>

          {/* Triage Nurse */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              (Optional if Doctor selected)<span className="text-red-500">*</span>
            </label>
            <select
              {...register('triage_nurse')}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
            >
              <option value="">— Assign Nurse —</option>
              {nurses.map((n: any) => (
                <option key={n.id} value={n.id}>
                  {n.user.first_name} {n.user.last_name}
                </option>
              ))}
            </select>
            {errors.triage_nurse && (
              <p className="mt-1 text-xs text-red-500">{errors.triage_nurse.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                min={today}
                {...register('date')}
                className="focus:ring-[#1E90FF]"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                {...register('time')}
                className="focus:ring-[#1E90FF]"
              />
              {errors.time && (
                <p className="mt-1 text-xs text-red-500">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Chief complaint or reason for visit"
              {...register('reason')}
              className="focus:ring-[#1E90FF]"
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Additional notes (optional)"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E90FF] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending}
              className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
            >
              {createMut.isPending ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}