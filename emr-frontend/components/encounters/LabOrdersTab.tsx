'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, FlaskConical, AlertCircle, Loader2, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { labApi, LabOrder } from '@/lib/api/lab';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// ── Schema ──────────────────────────────────────────────────────────
const orderSchema = z.object({
  test_id: z.coerce.number().min(1, 'Select a test'),
  clinical_notes: z.string().optional(),
});
type OrderFormValues = z.infer<typeof orderSchema>;

// ── Status config ────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  P: { label: 'Pending (→ LIS)', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  S: { label: 'Sent to Lab', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  R: { label: 'Results In', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  X: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

// ── Dummy LIS result ─────────────────────────────────────────────────
const DUMMY_LIS_RESULT = `LABORATORY REPORT
──────────────────────────────
Received from LIS Integration
Status: Verified

WBC:    7.2 x10^3/uL   (Ref: 4.5 - 11.0)
RBC:    4.8 x10^6/uL   (Ref: 4.5 - 5.9)
HGB:    14.2 g/dL      (Ref: 13.5 - 17.5)
HCT:    42.5 %         (Ref: 41.0 - 53.0)
PLT:    250 x10^3/uL   (Ref: 150 - 450)

Technician: LIS-AUTO
Received: ${new Date().toLocaleString()}`;

function LabOrderCard({ order, patientId }: { order: LabOrder; patientId: number }) {
  // Simulate external LIS returning dummy results automatically after 5 seconds
  // const timeSinceOrdered = Date.now() - new Date(order.ordered_at).getTime();
  // const isResultReady = order.status === 'R' || !!order.result_text || timeSinceOrdered > 5000;
   // REPLACE WITH:
  const isResultReady = order.status === 'R' || !!order.result_text;
  const statusToDisplay = isResultReady ? 'R' : order.status;

  const cfg = statusConfig[statusToDisplay] ?? statusConfig.P;
  const Icon = cfg.icon;
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{order.test?.name ?? 'Lab Test'}</CardTitle>
            <CardDescription className="mt-0.5">
              Code: {order.test?.code} · Ordered {new Date(order.ordered_at).toLocaleString()}
            </CardDescription>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
            <Icon className="size-3" />
            {cfg.label}
          </span>
        </div>
      </CardHeader>
      {isResultReady && (
        <CardContent>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">LIS Result</span>
            </div>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
              {order.result_text || DUMMY_LIS_RESULT}
            </pre>
          </div>
        </CardContent>
      )}
      {order.clinical_notes && (
        <CardContent className="pt-0">
          <p className="text-xs text-slate-500 italic">{order.clinical_notes}</p>
        </CardContent>
      )}
    </Card>
  );
}

export function LabOrdersTab({ encounterId, patientId }: { encounterId: number; patientId: number }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const canOrder = user?.role === 'doctor' || user?.role === 'admin';

  // Fetch lab tests catalogue
  const { data: testsData } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: () => labApi.listTests(),
    staleTime: 1000 * 60 * 10,
  });
  const tests = testsData?.results ?? [];

  // Fetch lab orders for this encounter
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lab-orders', encounterId],
    queryFn: () => labApi.listOrders({ encounter: encounterId }),
    enabled: !!encounterId,
    refetchInterval: 3000, 
  });
  const orders = data?.results ?? [];

  const createMutation = useMutation({
    mutationFn: (values: OrderFormValues) =>
      labApi.createOrder({
        encounter: encounterId,
        patient: patientId,
        test: values.test_id,
        clinical_notes: values.clinical_notes ?? '',
        ordered_by: user!.id,
      }),
    onSuccess: () => {
      toast.success('Lab order sent to LIS ✓');
      qc.invalidateQueries({ queryKey: ['lab-orders', encounterId] });
      setOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create lab order'),
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { test_id: 0, clinical_notes: '' },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Laboratory Orders</h2>
          <p className="mt-1 text-sm text-slate-500">Lab requests dispatched to the Laboratory Information System (LIS).</p>
        </div>
        {canOrder && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" />Order Lab Test</Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle>Order Laboratory Test</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-6">
                  <FormField control={form.control} name="test_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Test</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a test…" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tests.length === 0 ? (
                            // Fallback dummy tests for demo purposes
                            ['Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Comprehensive Metabolic Panel (CMP)', 'Lipid Panel', 'Urinalysis'].map((t, i) => (
                              <SelectItem key={i} value={String(i + 1)}>{t}</SelectItem>
                            ))
                          ) : (
                            tests.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="clinical_notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical Notes (optional)</FormLabel>
                      <FormControl><Textarea placeholder="Reason for ordering / clinical indication…" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 flex items-center gap-2 text-xs text-blue-700">
                    <FlaskConical className="size-3.5 shrink-0" />
                    This order will be sent to LIS. Results are returned automatically when ready.
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                      Send to LIS
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <AlertCircle className="size-4" /> Unable to load lab orders.
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FlaskConical className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No lab orders yet</p>
          {canOrder && <p className="mt-1 text-sm text-slate-500">Click "Order Lab Test" to request a study.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <LabOrderCard key={order.id} order={order} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
