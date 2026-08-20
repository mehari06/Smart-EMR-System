'use client';

import { useAllergies } from '@/hooks/useAllergies';
import { PatientAllergy } from '@/types/allergies';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AllergySheet } from './AllergySheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RightContextPanelProps {
  patientId: number;
}

export default function RightContextPanel({ patientId }: RightContextPanelProps) {
  const { data, isLoading, isError, removeAllergy } = useAllergies(patientId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const allergies = data?.results || [];

  return (
    <div className="flex h-full flex-col">
      {/* Allergies Section */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
            Allergies
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            Failed to load allergies.
          </div>
        ) : allergies.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded text-center border border-dashed">
            No Known Allergies (NKA)
          </div>
        ) : (
          <div className="space-y-2">
            {allergies.map((allergy: PatientAllergy) => (
              <div key={allergy.id} className="group relative flex items-start justify-between p-2 rounded-md bg-red-50 border border-red-100 transition-colors hover:bg-red-100/50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900 text-sm">
                      {allergy.allergy_name}
                    </span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-1.5 py-0 h-4 border-none",
                      allergy.severity === 'S' ? "bg-red-200 text-red-900" :
                      allergy.severity === 'O' ? "bg-orange-200 text-orange-900" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {allergy.severity_display}
                    </Badge>
                  </div>
                  {allergy.reaction && (
                    <div className="text-xs text-slate-600 mt-1">
                      {allergy.reaction}
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-100 shrink-0 ml-2"
                  onClick={() => removeAllergy.mutate(allergy.id)}
                  disabled={removeAllergy.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Medications (Placeholder) */}
      <div className="p-4 border-b opacity-50">
        <h3 className="font-semibold text-slate-900 mb-2">Active Meds</h3>
        <div className="text-sm text-slate-500 italic">Coming soon...</div>
      </div>
      
      <AllergySheet open={sheetOpen} onOpenChange={setSheetOpen} patientId={patientId} />
    </div>
  );
}
