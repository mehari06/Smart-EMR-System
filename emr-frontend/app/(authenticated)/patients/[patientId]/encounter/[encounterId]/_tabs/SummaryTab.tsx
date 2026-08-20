'use client';

import { useEncounterContext } from '../_provider/EncounterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryTab({ patientId, encounterId }: { patientId: number, encounterId: number }) {
  const { encounter, isLoading } = useEncounterContext();

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full" /></div>;
  }

  if (!encounter) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Encounter Summary</h2>
        <p className="text-slate-500">Overview of the current visit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chief Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{encounter.chief_complaint || 'Not recorded'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            {encounter.vitalsign ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Blood Pressure</div>
                  <div className="font-medium">{encounter.vitalsign.systolic_pressure}/{encounter.vitalsign.diastolic_pressure} mmHg</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Heart Rate</div>
                  <div className="font-medium">{encounter.vitalsign.pulse_rate} bpm</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Temperature</div>
                  <div className="font-medium">{encounter.vitalsign.temperature} °C</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Weight</div>
                  <div className="font-medium">{encounter.vitalsign.weight} kg</div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">No vitals recorded for this encounter.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
