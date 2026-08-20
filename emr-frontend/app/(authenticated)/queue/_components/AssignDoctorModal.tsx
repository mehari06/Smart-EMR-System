'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, DoorOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/api/core';
import { useAssignDoctor } from '@/hooks/useQueue';
import type { PatientQueueItem } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const assignDoctorSchema = z.object({
  doctor_id: z.coerce.number().min(1, 'Please select a doctor'),
  room: z.string().optional(),
});

type AssignDoctorFormValues = z.infer<typeof assignDoctorSchema>;

interface AssignDoctorModalProps {
  queueItem: PatientQueueItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignDoctorModal({ queueItem, open, onOpenChange }: AssignDoctorModalProps) {
  const assignDoctor = useAssignDoctor();

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => coreApi.getStaff(),
    enabled: open,
  });

  const doctors = (staffData?.results ?? []).filter(
    (s) => s.user?.role === 'doctor' && s.is_active
  );

  const form = useForm<AssignDoctorFormValues>({
    resolver: zodResolver(assignDoctorSchema),
    defaultValues: {
      doctor_id: queueItem.assigned_doctor?.id || 0,
      room: queueItem.assigned_room || '',
    },
  });

  const onSubmit = (values: AssignDoctorFormValues) => {
    assignDoctor.mutate(
      { id: queueItem.id, data: values },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#1E90FF]" />
            Assign Doctor
          </DialogTitle>
        </DialogHeader>

        {/* Patient Info */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <p className="font-semibold text-slate-900">
            {queueItem.patient?.full_name}
          </p>
          <p className="text-sm text-slate-500">
            {queueItem.patient?.patient_number} • {queueItem.chief_complaint}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No active doctors available
                        </div>
                      ) : (
                        doctors.map((doc) => (
                          <SelectItem key={doc.id} value={String(doc.id)}>
                            Dr. {doc.user.first_name} {doc.user.last_name}
                            {doc.specialization && ` (${doc.specialization})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Room 3" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignDoctor.isPending}
                className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
              >
                {assignDoctor.isPending ? 'Assigning...' : 'Assign Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}