'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Save } from 'lucide-react';
import { useVitals } from '@/hooks/useVitals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const vitalsSchema = z.object({
  temperature: z.coerce.number().min(30, 'Too low').max(45, 'Too high'),
  systolic_pressure: z.coerce.number().min(50).max(250),
  diastolic_pressure: z.coerce.number().min(30).max(150),
  pulse_rate: z.coerce.number().min(30).max(220),
  respiratory_rate: z.coerce.number().min(8).max(60),
  oxygen_saturation: z.coerce.number().min(50).max(100),
  height: z.coerce.number().min(20).max(250),
  weight: z.coerce.number().min(1).max(300),
});

type VitalsFormValues = z.infer<typeof vitalsSchema>;

function defaults(latest?: Partial<VitalsFormValues>) {
  return {
    temperature: latest?.temperature ?? 36.5,
    systolic_pressure: latest?.systolic_pressure ?? 120,
    diastolic_pressure: latest?.diastolic_pressure ?? 80,
    pulse_rate: latest?.pulse_rate ?? 72,
    respiratory_rate: latest?.respiratory_rate ?? 16,
    oxygen_saturation: latest?.oxygen_saturation ?? 98,
    height: latest?.height ?? 170,
    weight: latest?.weight ?? 70,
  };
}

function calculateBmi(height?: number, weight?: number) {
  if (!height || !weight) return '';
  const meters = height / 100;
  if (meters <= 0) return '';
  return (weight / (meters * meters)).toFixed(1);
}

export function VitalsForm({ encounterId }: { encounterId: number }) {
  const { data, isLoading, isError, recordVitals } = useVitals(encounterId);
  const latest = data?.results?.[0];
  const [open, setOpen] = useState(false);

  const form = useForm<VitalsFormValues>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: defaults(),
  });

  useEffect(() => {
    if (latest) form.reset(defaults(latest));
  }, [latest, form]);

  const height = useWatch({ control: form.control, name: 'height' });
  const weight = useWatch({ control: form.control, name: 'weight' });
  const bmi = useMemo(() => calculateBmi(height, weight), [height, weight]);

  const onSubmit = (values: VitalsFormValues) => {
    recordVitals.mutate(values, {
      onSuccess: () => setOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Latest Vitals</CardTitle>
              <CardDescription>Current measurements attached to this encounter.</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="size-4" /> Add Vitals</Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-3xl shadow-xl">
                <DialogHeader>
                  <DialogTitle>Record Vital Signs</DialogTitle>
                  <DialogDescription>Capture standard observations. BMI is calculated from height and weight.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex justify-end">{bmi && <Badge variant="secondary">BMI {bmi}</Badge>}</div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <NumberField control={form.control} name="temperature" label="Temp (C)" step="0.1" />
                      <NumberField control={form.control} name="systolic_pressure" label="Systolic" />
                      <NumberField control={form.control} name="diastolic_pressure" label="Diastolic" />
                      <NumberField control={form.control} name="pulse_rate" label="Pulse" />
                      <NumberField control={form.control} name="respiratory_rate" label="Resp. Rate" />
                      <NumberField control={form.control} name="oxygen_saturation" label="SpO2 (%)" />
                      <NumberField control={form.control} name="height" label="Height (cm)" step="0.1" />
                      <NumberField control={form.control} name="weight" label="Weight (kg)" step="0.1" />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={recordVitals.isPending}>
                        <Save className="size-4" />
                        {recordVitals.isPending ? 'Saving...' : 'Save Vitals'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-danger">Unable to load vitals.</p>
          ) : latest ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Temperature" value={`${latest.temperature} C`} isAbnormal={latest.temperature < 35 || latest.temperature > 38} />
              <Metric label="Blood Pressure" value={`${latest.systolic_pressure}/${latest.diastolic_pressure}`} isAbnormal={latest.systolic_pressure < 90 || latest.systolic_pressure >= 140 || latest.diastolic_pressure >= 90} />
              <Metric label="Pulse" value={`${latest.pulse_rate} bpm`} isAbnormal={latest.pulse_rate < 50 || latest.pulse_rate > 110} />
              <Metric label="SpO2" value={`${latest.oxygen_saturation}%`} isAbnormal={latest.oxygen_saturation < 92} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-slate-500">No vitals have been recorded for this encounter.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, isAbnormal }: { label: string; value: string; isAbnormal?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${isAbnormal ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20' : 'border-border bg-slate-50 dark:bg-slate-900'}`}>
      <p className={`text-xs font-medium uppercase ${isAbnormal ? 'text-rose-600' : 'text-slate-500'}`}>{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-lg font-semibold">{value}</p>
        {isAbnormal && <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-100">Abnormal</Badge>}
      </div>
    </div>
  );
}

function NumberField({ control, name, label, step }: { control: any; name: keyof VitalsFormValues; label: string; step?: string }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type="number" step={step} {...field} /></FormControl>
        <FormMessage className="text-xs text-danger" />
      </FormItem>
    )} />
  );
}
