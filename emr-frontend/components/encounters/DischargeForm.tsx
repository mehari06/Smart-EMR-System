'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarCheck, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useEncounter } from '@/hooks/useEncounter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const dischargeSchema = z.object({
  discharge_summary: z.string().min(5, 'Discharge summary is required'),
  follow_up_date: z.string().optional(),
  outcome: z.enum(['improved', 'stable', 'referred', 'admitted', 'deceased']),
});

type DischargeFormValues = z.infer<typeof dischargeSchema>;

export function DischargeForm({ encounterId }: { encounterId: number }) {
  const { data: encounter, isLoading, isError, updateEncounter } = useEncounter(encounterId);

  const form = useForm<DischargeFormValues>({
    resolver: zodResolver(dischargeSchema),
    values: {
      discharge_summary: encounter?.discharge_summary ?? '',
      follow_up_date: '',
      outcome: 'improved',
    },
  });

  const onSubmit = (values: DischargeFormValues) => {
    const followUp = values.follow_up_date ? `\n\nFollow-up date: ${values.follow_up_date}` : '';
    const outcome = `\nOutcome: ${values.outcome}`;

    updateEncounter.mutate(
      {
        discharge_summary: `${values.discharge_summary}${outcome}${followUp}`,
        status: 'C',
      },
      {
        onSuccess: () => toast.success('Discharge details saved'),
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-[520px] w-full rounded-xl" />;
  }

  if (isError) {
    return <p className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">Unable to load discharge details.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <CardTitle>Discharge</CardTitle>
            <CardDescription>Finalize the encounter summary and clinical outcome.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="discharge_summary" render={({ field }) => (
              <FormItem>
                <FormLabel>Discharge Summary</FormLabel>
                <FormControl>
                  <Textarea rows={8} placeholder="Clinical course, treatment provided, patient condition at discharge..." {...field} />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">Saved to the encounter discharge summary.</FormDescription>
                <FormMessage className="text-xs text-danger" />
              </FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="follow_up_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage className="text-xs text-danger" />
                </FormItem>
              )} />
              <FormField control={form.control} name="outcome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="improved">Improved</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="referred">Referred</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-danger" />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" disabled={updateEncounter.isPending}>
                <Save className="size-4" />
                {updateEncounter.isPending ? 'Saving...' : 'Save Discharge'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}