'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api/patients';
import { useAddToQueue } from '@/hooks/useQueue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const addToQueueSchema = z.object({
  patient_id: z.coerce.number().min(1, 'Please select a patient'),
  chief_complaint: z.string().min(3, 'Chief complaint is required').optional(),
});

type AddToQueueFormValues = z.infer<typeof addToQueueSchema>;

export function AddToQueueModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const addToQueue = useAddToQueue();

  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients', 'queue', search],
    queryFn: () => patientsApi.list({ search, page_size: 50 }),
    enabled: open,
  });

  const patients = patientsData?.results ?? [];

  const form = useForm<AddToQueueFormValues>({
    resolver: zodResolver(addToQueueSchema),
    defaultValues: {
      patient_id: 0,
      chief_complaint: '',
    },
  });

  const onSubmit = (values: AddToQueueFormValues) => {
    addToQueue.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setSearch('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#1E90FF] hover:bg-[#1a7ae0] text-white">
          <UserPlus className="h-4 w-4" />
          Add to Queue
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Add Patient to Queue
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Search patients..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="mb-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {isLoadingPatients ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          Loading...
                        </div>
                      ) : patients.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No patients found
                        </div>
                      ) : (
                        patients.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.full_name} ({p.patient_number})
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
              name="chief_complaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of why patient is here..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addToQueue.isPending}
                className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
              >
                {addToQueue.isPending ? 'Adding...' : 'Add to Queue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}