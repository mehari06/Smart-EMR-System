'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { clinicalApi } from '@/lib/api/clinical';
import { patientsApi } from '@/lib/api/patients';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  patient_id: z.coerce.number().min(1, 'Please select a patient'),
  chief_complaint: z.string().min(3, 'Chief complaint is required'),
});

export function NewEncounterDialog({
  trigger,
  defaultPatientId,
  onSuccess,
}: {
  trigger?: React.ReactNode;
  defaultPatientId?: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // We can fetch a list of patients. For a real EMR, this would be an async search combobox.
  // We'll use a simple select for now limited to the first 100 patients.
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients', 'list', { page_size: 100 }],
    queryFn: () => patientsApi.list({ page_size: 100 }),
    enabled: open,
  });
  const patients = patientsData?.results ?? [];

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: defaultPatientId ?? 0,
      chief_complaint: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      clinicalApi.createEncounter({
        patient: values.patient_id,
        chief_complaint: values.chief_complaint,
      }),
    onSuccess: (data) => {
      toast.success('Encounter started successfully');
      qc.invalidateQueries({ queryKey: ['encounters'] });
      setOpen(false);
      form.reset();
      if (onSuccess) onSuccess();
      // Redirect to the new encounter's summary tab
      router.push(`/patients/${data.patient.id}/encounter/${data.id}/summary`);
    },
    onError: () => toast.error('Failed to start encounter'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="size-4 mr-2" /> New Encounter</Button>}
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle>Start New Encounter</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <FormField control={form.control} name="patient_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger disabled={isLoadingPatients || !!defaultPatientId}>
                      <SelectValue placeholder="Select patient..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.full_name} ({p.patient_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="chief_complaint" render={({ field }) => (
              <FormItem>
                <FormLabel>Chief Complaint</FormLabel>
                <FormControl>
                  <Textarea placeholder="Brief description of the patient's main issue..." className="h-24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Start Encounter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
