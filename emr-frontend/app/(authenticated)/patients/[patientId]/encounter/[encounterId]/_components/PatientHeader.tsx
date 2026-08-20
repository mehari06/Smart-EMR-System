'use client';

import { useEncounterContext } from '../_provider/EncounterContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Activity, AlertCircle } from 'lucide-react';
import { calculateAge } from '@/lib/utils/date';

export default function PatientHeader() {
  const { patient, encounter, isLoading } = useEncounterContext();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-4 border-b bg-white shadow-sm">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!patient || !encounter) {
    return (
      <div className="p-4 border-b bg-white shadow-sm flex items-center justify-center text-red-500">
        <AlertCircle className="mr-2 h-5 w-5" />
        Failed to load patient context.
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {patient.profile_photo ? (
            <img src={patient.profile_photo} alt={patient.user.full_name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>
        
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{patient.user.full_name}</h2>
            <Badge variant="outline" className="font-mono text-slate-500">{patient.patient_number}</Badge>
            <Badge className={
              encounter.status === 'O' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
              encounter.status === 'C' ? 'bg-slate-100 text-slate-800 hover:bg-slate-100' :
              'bg-red-100 text-red-800 hover:bg-red-100'
            }>
              {encounter.status_display} Encounter
            </Badge>
          </div>
          <div className="text-sm text-slate-500 mt-1 flex items-center space-x-3">
            <span>{age} years old</span>
            <span className="text-slate-300">•</span>
            <span>{patient.gender_display}</span>
            {patient.blood_group && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-red-500 font-medium">{patient.blood_group_display}</span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span className="flex items-center text-slate-600">
              Provider: <span className="font-medium ml-1 text-slate-900">{encounter.doctor?.full_name || 'Unassigned'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-end mr-4">
          <span className="text-xs text-slate-500 uppercase font-semibold">Chief Complaint</span>
          <span className="text-sm font-medium text-slate-900 max-w-[300px] truncate" title={encounter.chief_complaint}>
            {encounter.chief_complaint}
          </span>
        </div>
      </div>
    </div>
  );
}
