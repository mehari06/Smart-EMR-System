'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useDiagnoses } from '@/hooks/useDiagnoses';
import { useAuthStore } from '@/store/useAuthStore';
import type { Diagnosis } from '@/types/clinical';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { DashboardDataTable, SortableHeader } from '@/components/dashboard/DashboardShared';

const diagnosisSchema = z.object({
  icd10_code: z.string().min(2, 'ICD-10 code is required').max(20),
  description: z.string().min(3, 'Description is required').max(255),
  order: z.enum(['P', 'S']),
  certainty: z.enum(['C', 'P']),
  diag_status: z.enum(['A', 'R']),
  treatment_plan: z.string().optional(),
  clinical_notes: z.string().optional(),
});

type DiagnosisFormValues = z.infer<typeof diagnosisSchema>;

const editableRoles = new Set(['admin', 'doctor', 'staff_head']);

export function DiagnosesTable({ encounterId }: { encounterId: number }) {
  const { data, isLoading, isError, addDiagnosis, updateDiagnosis } = useDiagnoses(encounterId);
  const user = useAuthStore((state) => state.user);
  const canEdit = !!user?.role && editableRoles.has(user.role);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const diagnoses = data?.results ?? [];

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      icd10_code: '',
      description: '',
      order: 'P',
      certainty: 'C',
      diag_status: 'A',
      treatment_plan: '',
      clinical_notes: '',
    },
  });

  const columns = useMemo<ColumnDef<Diagnosis>[]>(() => [
    {
      accessorKey: 'icd10_code',
      header: ({ column }) => <SortableHeader label="ICD-10" column={column} />,
      cell: ({ row }) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.icd10_code}</span>,
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <SortableHeader label="Description" column={column} />,
      cell: ({ row }) => <span className="text-slate-700 dark:text-slate-300">{row.original.description}</span>,
    },
    {
      accessorKey: 'diag_status_display',
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => <Badge variant={row.original.diag_status === 'A' ? 'default' : 'outline'}>{row.original.diag_status_display ?? row.original.diag_status}</Badge>,
    },
    {
      accessorKey: 'certainty_display',
      header: ({ column }) => <SortableHeader label="Certainty" column={column} />,
      cell: ({ row }) => row.original.certainty_display ?? row.original.certainty,
    },
    {
      accessorKey: 'order_display',
      header: ({ column }) => <SortableHeader label="Order" column={column} />,
      cell: ({ row }) => row.original.order_display ?? row.original.order,
    },
    {
      accessorKey: 'diagnosed_at',
      header: ({ column }) => <SortableHeader label="Recorded" column={column} />,
      cell: ({ row }) => row.original.diagnosed_at ? new Date(row.original.diagnosed_at).toLocaleDateString() : '-',
    },
    ...(canEdit ? [{
      id: 'actions',
      cell: ({ row }: { row: any }) => (
        <Button variant="ghost" size="icon-sm" onClick={() => {
          form.reset({
            icd10_code: row.original.icd10_code,
            description: row.original.description,
            order: row.original.order,
            certainty: row.original.certainty,
            diag_status: row.original.diag_status,
            treatment_plan: row.original.treatment_plan ?? '',
            clinical_notes: row.original.clinical_notes ?? '',
          });
          setEditingId(row.original.id);
          setOpen(true);
        }}>
          <Edit2 className="size-4" />
        </Button>
      ),
    }] : []),
  ], [canEdit, form]);

  const onSubmit = (values: DiagnosisFormValues) => {
    if (editingId) {
      updateDiagnosis.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          form.reset();
          setEditingId(null);
          setOpen(false);
        },
      });
    } else {
      addDiagnosis.mutate(values, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setEditingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Diagnoses</CardTitle>
            <CardDescription>ICD-10 diagnoses, certainty, and clinical status for this encounter.</CardDescription>
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={() => { form.reset(); setEditingId(null); }}><Plus className="size-4 mr-2" /> Add Diagnosis</Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-2xl shadow-xl">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit Diagnosis' : 'Add Diagnosis'}</DialogTitle>
                  <DialogDescription>Record or update a diagnosis for this encounter.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <datalist id="icd10-suggestions">
                      <option value="J01.90">Acute sinusitis</option>
                      <option value="J02.9">Acute pharyngitis</option>
                      <option value="J20.9">Acute bronchitis</option>
                      <option value="I10">Essential hypertension</option>
                      <option value="E11.9">Type 2 diabetes</option>
                      <option value="J45.909">Asthma</option>
                    </datalist>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField control={form.control} name="icd10_code" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICD-10 Code</FormLabel>
                          <FormControl><Input placeholder="J01.90" list="icd10-suggestions" {...field} /></FormControl>
                          <FormMessage className="text-xs text-danger" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="Acute sinusitis" {...field} /></FormControl>
                          <FormMessage className="text-xs text-danger" />
                        </FormItem>
                      )} />
                      <SelectField control={form.control} name="order" label="Order" options={[["P", "Primary"], ["S", "Secondary"]]} />
                      <SelectField control={form.control} name="certainty" label="Certainty" options={[["C", "Confirmed"], ["P", "Presumed"]]} />
                      <SelectField control={form.control} name="diag_status" label="Status" options={[["A", "Active"], ["R", "Ruled Out"]]} />
                    </div>
                    <FormField control={form.control} name="treatment_plan" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment Plan</FormLabel>
                        <FormControl><Textarea placeholder="Initial treatment plan" {...field} /></FormControl>
                        <FormMessage className="text-xs text-danger" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="clinical_notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Notes</FormLabel>
                        <FormControl><Textarea placeholder="Supporting notes" {...field} /></FormControl>
                        <FormMessage className="text-xs text-danger" />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                      <Button type="submit" disabled={addDiagnosis.isPending || updateDiagnosis.isPending}>
                        {addDiagnosis.isPending || updateDiagnosis.isPending ? 'Saving...' : 'Save Diagnosis'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">Unable to load diagnoses.</p>
        ) : diagnoses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-slate-500">No diagnoses recorded for this encounter.</div>
        ) : (
          <DashboardDataTable data={diagnoses} columns={columns} searchPlaceholder="Filter diagnoses..." />
        )}
      </CardContent>
    </Card>
  );
}

function SelectField({ control, name, label, options }: { control: any; name: keyof DiagnosisFormValues; label: string; options: Array<[string, string]> }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value as string}>
          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
          <SelectContent>{options.map(([value, labelText]) => <SelectItem key={value} value={value}>{labelText}</SelectItem>)}</SelectContent>
        </Select>
        <FormMessage className="text-xs text-danger" />
      </FormItem>
    )} />
  );
}
