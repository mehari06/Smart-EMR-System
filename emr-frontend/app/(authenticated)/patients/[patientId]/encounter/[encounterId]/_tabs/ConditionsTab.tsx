'use client';

import { useState } from 'react';
import { MedicalHistory } from '@/types/clinical';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { MedicalHistoryForm } from '@/components/encounters/MedicalHistoryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';

export default function ConditionsTab({ patientId }: { patientId: number, encounterId: number }) {
  const { data, isLoading } = useMedicalHistory(patientId);
  const [formOpen, setFormOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<MedicalHistory | null>(null);
  
  const conditions = data?.results || [];

  const active = conditions.filter((c: MedicalHistory) => c.status === 'A');
  const historical = conditions.filter((c: MedicalHistory) => c.status === 'R' || c.status === 'M');

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  const renderList = (items: typeof conditions) => {
    if (items.length === 0) {
      return <div className="p-8 text-center text-slate-500 border rounded-md border-dashed">No conditions found.</div>;
    }
    return (
      <div className="space-y-2">
        {items.map((c: MedicalHistory) => (
          <div key={c.id} className="p-4 border rounded-md bg-white shadow-sm flex justify-between items-center">
            <div>
              <div className="font-medium text-slate-900">{c.condition_name}</div>
              <div className="text-sm text-slate-500">
                {c.condition_type_display} 
                {c.onset_date ? ` • Onset: ${c.onset_date}` : ''}
                {c.icd10_code ? ` • ICD-10: ${c.icd10_code}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#1E90FF] hover:bg-blue-50"
                onClick={() => {
                  setEditHistory(c);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <div className="text-sm text-slate-400">
                {c.status_display}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Conditions</h2>
          <p className="text-slate-500">Patient medical history (Active vs Historical).</p>
        </div>
        <Button
          onClick={() => {
            setEditHistory(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Condition
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Conditions ({active.length})</TabsTrigger>
          <TabsTrigger value="historical">History Of ({historical.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {renderList(active)}
        </TabsContent>
        <TabsContent value="historical">
          {renderList(historical)}
        </TabsContent>
      </Tabs>

      <MedicalHistoryForm
        patientId={patientId}
        history={editHistory}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}