'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Pill, Send, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { useAuthStore } from '@/store/useAuthStore';
import type { Prescription } from '@/types/prescription';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// ── Schema ──────────────────────────────────────────────────────────
const itemSchema = z.object({
  medicine_name: z.string().min(1, 'Medicine name required'),
  medicine_id: z.coerce.number().optional(),
  dosage: z.string().min(1, 'Dosage required'),
  frequency: z.string().min(1, 'Frequency required'),
  duration: z.string().min(1, 'Duration required'),
  quantity: z.coerce.number().min(1),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  instructions: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one medicine'),
});

type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

const statusConfig = {
  A: { label: 'Active (→ PIS)', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  D: { label: 'Dispensed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  X: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

// ── PIS Status Badge ─────────────────────────────────────────────────
function PisStatusBadge({ status }: { status: 'A' | 'D' | 'X' }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

// ── Prescription Card ────────────────────────────────────────────────
function PrescriptionCard({
  prescription,
  canDispense,
  onDispense,
}: {
  prescription: Prescription;
  canDispense: boolean;
  onDispense: (id: number, status: 'D' | 'X') => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Rx #{prescription.id}</CardTitle>
            <CardDescription className="mt-0.5">
              By {prescription.prescribed_by_name} · {new Date(prescription.prescribed_at).toLocaleString()}
            </CardDescription>
          </div>
          <PisStatusBadge status={prescription.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prescription.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.medicine?.name ?? '—'}{' '}
                <span className="font-normal text-slate-500">{item.medicine?.strength}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.dosage} · {item.frequency} · {item.duration} · Qty: {item.quantity}
              </p>
              {item.instructions && <p className="text-xs text-slate-400 mt-0.5 italic">{item.instructions}</p>}
            </div>
          </div>
        ))}
        {prescription.instructions && (
          <p className="text-sm text-slate-600 dark:text-slate-400 rounded-md bg-amber-50 p-2 border border-amber-100">
            ℹ {prescription.instructions}
          </p>
        )}
        {canDispense && prescription.status === 'A' && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => onDispense(prescription.id, 'D')}>
              <CheckCircle2 className="size-3.5 mr-1" /> Mark Dispensed
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => onDispense(prescription.id, 'X')}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function PrescriptionsTab({ encounterId }: { encounterId: number }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const canPrescribe = user?.role === 'doctor' || user?.role === 'admin';
  const canDispense = user?.role === 'pharmacist' || user?.role === 'admin';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['prescriptions', encounterId],
    queryFn: () => prescriptionsApi.list({ encounter: encounterId }),
    enabled: !!encounterId,
  });

  const prescriptions = data?.results ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreatePrescriptionData) => prescriptionsApi.create(data),
    onSuccess: () => {
      toast.success('Prescription sent to PIS ✓');
      qc.invalidateQueries({ queryKey: ['prescriptions', encounterId] });
      setOpen(false);
    },
    onError: () => toast.error('Failed to create prescription'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'D' | 'X' }) =>
      prescriptionsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === 'D' ? 'Marked as dispensed' : 'Prescription cancelled');
      qc.invalidateQueries({ queryKey: ['prescriptions', encounterId] });
    },
    onError: () => toast.error('Failed to update prescription'),
  });

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: { instructions: '', items: [{ medicine_name: '', dosage: '', frequency: 'Once daily', duration: '7 days', quantity: 1, instructions: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const onSubmit = useCallback((values: PrescriptionFormValues) => {
    if (!user?.id) return;
    createMutation.mutate({
      encounter: encounterId,
      prescribed_by: user.id,
      instructions: values.instructions,
      items: values.items.map((item) => ({
        medicine_id: item.medicine_id ?? 0,
        medicine_name: item.medicine_name,  
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
      })),
    });
  }, [createMutation, encounterId, user]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Prescriptions</h2>
          <p className="mt-1 text-sm text-slate-500">Medications ordered for this encounter. Dispatched automatically to PIS.</p>
        </div>
        {canPrescribe && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" />New Prescription</Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl shadow-xl">
              <DialogHeader>
                <DialogTitle>New Prescription</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">Medicine {index + 1}</p>
                          {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                              <Trash2 className="size-3.5 text-rose-500" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormField control={form.control} name={`items.${index}.medicine_name`} render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Medicine Name</FormLabel>
                              <FormControl><Input placeholder="e.g. Amoxicillin" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`items.${index}.dosage`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dosage</FormLabel>
                              <FormControl><Input placeholder="500mg" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`items.${index}.frequency`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <FormControl>
                                <Input list="frequency-options" placeholder="Once daily" {...field} />
                              </FormControl>
                              <datalist id="frequency-options">
                                <option value="Once daily" />
                                <option value="Twice daily" />
                                <option value="Three times daily" />
                                <option value="Four times daily" />
                                <option value="Every 8 hours" />
                                <option value="As needed (PRN)" />
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`items.${index}.duration`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl><Input placeholder="7 days" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl><Input type="number" min={1} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`items.${index}.instructions`} render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Instructions (optional)</FormLabel>
                              <FormControl><Input placeholder="Take after meals" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ medicine_name: '', dosage: '', frequency: 'Once daily', duration: '7 days', quantity: 1, instructions: '' })}>
                    <Plus className="size-3.5 mr-1" /> Add Medicine
                  </Button>
                  <Separator />
                  <FormField control={form.control} name="instructions" render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Instructions</FormLabel>
                      <FormControl><Textarea placeholder="Any general instructions for the pharmacist..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 flex items-center gap-2 text-xs text-blue-700">
                    <Send className="size-3.5 shrink-0" />
                    This prescription will be dispatched automatically to the Pharmacy Information System (PIS).
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                      Send to PIS
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}</div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <AlertCircle className="size-4" /> Unable to load prescriptions.
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Pill className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No prescriptions yet</p>
          {canPrescribe && <p className="mt-1 text-sm text-slate-500">Click "New Prescription" to order medications.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              prescription={rx}
              canDispense={canDispense}
              onDispense={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Internal type for create - need to import correctly
type CreatePrescriptionData = import('@/types/prescription').CreatePrescriptionData;
