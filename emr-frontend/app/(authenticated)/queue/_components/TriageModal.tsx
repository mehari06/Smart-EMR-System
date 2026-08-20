'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HeartPulse, Activity, Thermometer, Droplets } from 'lucide-react';
import { useStartTriage, useCompleteTriage } from '@/hooks/useQueue';
import type { PatientQueueItem, TriageLevel } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';

const triageSchema = z.object({
  chief_complaint: z.string().min(3, 'Chief complaint is required'),
  triage_level: z.coerce.number().min(1).max(5),
  triage_notes: z.string().optional(),
  pain_score: z.coerce.number().min(0).max(10).optional(),
  temperature: z.coerce.number().optional(),
  heart_rate: z.coerce.number().optional(),
  systolic_bp: z.coerce.number().optional(),
  diastolic_bp: z.coerce.number().optional(),
  oxygen_saturation: z.coerce.number().optional(),
  respiratory_rate: z.coerce.number().optional(),
  is_fast_track: z.boolean().optional(),
});

type TriageFormValues = z.infer<typeof triageSchema>;

interface TriageModalProps {
  queueItem: PatientQueueItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TriageModal({ queueItem, open, onOpenChange }: TriageModalProps) {
  const startTriage = useStartTriage();
  const completeTriage = useCompleteTriage();
  const [isTriaging, setIsTriaging] = useState(false);

  const form = useForm<TriageFormValues>({
    resolver: zodResolver(triageSchema),
    defaultValues: {
      chief_complaint: queueItem.chief_complaint || '',
      triage_level: queueItem.triage_level || 3,
      triage_notes: '',
      pain_score: queueItem.pain_score || 0,
      temperature: typeof queueItem.temperature === 'number' ? queueItem.temperature : undefined,
      heart_rate: queueItem.heart_rate || undefined,
      systolic_bp: queueItem.systolic_bp || undefined,
      diastolic_bp: queueItem.diastolic_bp || undefined,
      oxygen_saturation: queueItem.oxygen_saturation || undefined,
      respiratory_rate: queueItem.respiratory_rate || undefined,
      is_fast_track: queueItem.is_fast_track || false,
    },
  });

  const handleStartTriage = () => {
    startTriage.mutate(queueItem.id, {
      onSuccess: () => {
        setIsTriaging(true);
      },
    });
  };

  const onSubmit = (values: TriageFormValues) => {
    completeTriage.mutate(
      { id: queueItem.id, data: values },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setIsTriaging(false);
        },
      }
    );
  };

  const triageLevel = form.watch('triage_level');
  const isEmergency = triageLevel <= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-red-500" />
            Triage Assessment
          </DialogTitle>
        </DialogHeader>

        {/* Patient Info */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex-1">
            <p className="font-semibold text-slate-900">
              {queueItem.patient?.full_name}
            </p>
            <p className="text-sm text-slate-500">
              {queueItem.patient?.patient_number} • Arrived {new Date(queueItem.arrival_time).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Wait Time</p>
            <p className="text-lg font-bold text-slate-900">
              {queueItem.wait_time} min
            </p>
          </div>
        </div>

        {!isTriaging && queueItem.current_status === 'W' ? (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              Patient is waiting for triage. Start triage to begin assessment.
            </p>
            <Button
              onClick={handleStartTriage}
              disabled={startTriage.isPending}
              className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
            >
              {startTriage.isPending ? 'Starting...' : 'Start Triage'}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Chief Complaint */}
              <FormField
                control={form.control}
                name="chief_complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Primary reason for visit..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Triage Level */}
              <FormField
                control={form.control}
                name="triage_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Triage Level <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select triage level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            Level {level} - {level === 1 ? 'Immediate' : level === 2 ? 'Emergent' : level === 3 ? 'Urgent' : level === 4 ? 'Semi-urgent' : 'Non-urgent'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEmergency && (
                      <p className="text-xs text-red-500 font-medium">
                        ⚠ Emergency case - Immediate attention required
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pain_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Score (0-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={10} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temp (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heart_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="systolic_bp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic BP</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diastolic_bp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic BP</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="oxygen_saturation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SpO2 (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="respiratory_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resp. Rate</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Triage Notes */}
              <FormField
                control={form.control}
                name="triage_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Triage Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional observations..."
                        className="resize-none h-20"
                        {...field}
                      />
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
                  disabled={completeTriage.isPending}
                  className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
                >
                  {completeTriage.isPending ? 'Saving...' : 'Complete Triage'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}