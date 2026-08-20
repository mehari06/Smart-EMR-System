export type AllergyCategory = 'D' | 'F' | 'E' | 'O';
export type AllergySeverity = 'M' | 'O' | 'S';

export interface Allergy {
  id: number;
  name: string;
  category: AllergyCategory;
  description: string;
}

export interface PatientAllergy {
  id: number;
  patient: number;
  allergy: number;
  allergy_name: string;
  severity: AllergySeverity;
  severity_display: string;
  reaction: string;
  notes: string;
  recorded_at: string;
}

export interface AllergyPayload {
  patient: number;
  allergy: number;
  severity: AllergySeverity;
  reaction: string;
  notes: string;
}
