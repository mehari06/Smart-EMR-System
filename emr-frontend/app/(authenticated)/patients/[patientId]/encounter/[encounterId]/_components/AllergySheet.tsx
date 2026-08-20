'use client';

import { useState } from 'react';
import { useAllergies } from '@/hooks/useAllergies';
import { Allergy, AllergySeverity } from '@/types/allergies';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AllergySearch } from './AllergySearch';

interface AllergySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
}

export function AllergySheet({ open, onOpenChange, patientId }: AllergySheetProps) {
  const { addAllergy } = useAllergies(patientId);
  const [selectedAllergy, setSelectedAllergy] = useState<Allergy | null>(null);
  const [severity, setSeverity] = useState<AllergySeverity>('M');
  const [reaction, setReaction] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!selectedAllergy) return;

    addAllergy.mutate(
      {
        patient: patientId,
        allergy: selectedAllergy.id,
        severity,
        reaction,
        notes,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setSelectedAllergy(null);
          setSeverity('M');
          setReaction('');
          setNotes('');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add Patient Allergy</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>Search Allergen <span className="text-red-500">*</span></Label>
            {!selectedAllergy ? (
              <AllergySearch onSelect={setSelectedAllergy} />
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                <div>
                  <div className="font-medium">{selectedAllergy.name}</div>
                  <div className="text-xs text-slate-500">Selected Allergen</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAllergy(null)}>Change</Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Severity <span className="text-red-500">*</span></Label>
            <Select value={severity} onValueChange={(val: AllergySeverity) => setSeverity(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Mild</SelectItem>
                <SelectItem value="O">Moderate</SelectItem>
                <SelectItem value="S">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reactions (e.g., Hives, Anaphylaxis)</Label>
            <Input 
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="List known reactions..." 
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other details..." 
              className="resize-none h-24"
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedAllergy || addAllergy.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {addAllergy.isPending ? 'Saving...' : 'Save Allergy'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
