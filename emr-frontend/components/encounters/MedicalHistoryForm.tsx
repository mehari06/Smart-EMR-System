'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { History, Loader2, Plus } from 'lucide-react';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import type { MedicalHistory } from '@/types/clinical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const medicalHistorySchema = z.object({
  condition_name: z.string().min(2, 'Condition name is required'),
  icd10_code: z.string().optional(),
  condition_type: z.enum(['CH', 'AC', 'SU', 'MH', 'FH', 'IM', 'OT']),
  status: z.enum(['A', 'R', 'M']),
  onset_date: z.string().optional(),
  resolution_date: z.string().optional(),
  notes: z.string().optional(),
});

type MedicalHistoryFormValues = z.infer<typeof medicalHistorySchema>;

interface MedicalHistoryFormProps {
  patientId: number;
  history?: MedicalHistory | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const CONDITION_TYPE_LABELS: Record<string, string> = {
  CH: 'Chronic Disease',
  AC: 'Acute Illness',
  SU: 'Surgical Procedure',
  MH: 'Mental Health',
  FH: 'Family History',
  IM: 'Immunization',
  OT: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  A: 'Active',
  R: 'Resolved',
  M: 'Managed / Controlled',
};

export function MedicalHistoryForm({ patientId, history, open, onOpenChange, trigger }: MedicalHistoryFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const isEdit = !!history;
  const { addMedicalHistory, updateMedicalHistory } = useMedicalHistory(patientId);

  const form = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      condition_name: '',
      icd10_code: '',
      condition_type: 'CH',
      status: 'A',
      onset_date: '',
      resolution_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (history) {
        form.reset({
          condition_name: history.condition_name,
          icd10_code: history.icd10_code || '',
          condition_type: history.condition_type,
          status: history.status,
          onset_date: history.onset_date || '',
          resolution_date: history.resolution_date || '',
          notes: history.notes || '',
        });
      } else {
        form.reset({
          condition_name: '',
          icd10_code: '',
          condition_type: 'CH',
          status: 'A',
          onset_date: '',
          resolution_date: '',
          notes: '',
        });
      }
    }
  }, [isOpen, history, form]);

  const onSubmit = (values: MedicalHistoryFormValues) => {
    const data = {
      ...values,
      onset_date: values.onset_date || null,
      resolution_date: values.resolution_date || null,
    };

    if (isEdit && history) {
      updateMedicalHistory.mutate(
        { id: history.id, data },
        { onSuccess: () => setIsOpen(false) }
      );
    } else {
      addMedicalHistory.mutate(data, {
        onSuccess: () => setIsOpen(false),
      });
    }
  };

  const isPending = addMedicalHistory.isPending || updateMedicalHistory.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-[#1E90FF]" />
            {isEdit ? 'Edit Medical History' : 'Add Medical History'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="condition_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Condition Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hypertension, Appendectomy, COVID-19 Vaccine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icd10_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ICD-10 Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., I10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONDITION_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onset_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onset Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolution_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about this condition..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}