export interface EncounterPatientBrief {
  id: number;
  patient_number: string;
  full_name: string;
  gender: 'M' | 'F' | 'O';
  date_of_birth: string;
}

export interface DoctorBrief {
  id: number;
  full_name: string;
  specialization?: string;
}

export type EncounterStatus = 'O' | 'C' | 'X';
export type EncounterStatusDisplay = 'Open' | 'Completed' | 'Cancelled';

export type DiagnosisOrder = 'P' | 'S';
export type DiagnosisCertainty = 'C' | 'P';
export type DiagnosisStatus = 'A' | 'R';

export type MedicalHistoryType = 'CH' | 'AC' | 'SU' | 'MH' | 'FH' | 'IM' | 'OT';
export type MedicalHistoryStatus = 'A' | 'R' | 'M';

export interface VitalSign {
  id: number;
  encounter: number;
  temperature: number;
  systolic_pressure: number;
  diastolic_pressure: number;
  pulse_rate: number;
  respiratory_rate: number;
  oxygen_saturation: number;
  height: number;
  weight: number;
  bmi: number;
  recorded_by?: number;
  recorded_by_name?: string;
  recorded_at: string;
}

export interface Diagnosis {
  id: number;
  encounter: number;
  icd10_code: string;
  description: string;
  order: DiagnosisOrder;
  order_display: string;
  certainty: DiagnosisCertainty;
  certainty_display: string;
  diag_status: DiagnosisStatus;
  diag_status_display: string;
  treatment_plan: string;
  clinical_notes: string;
  diagnosed_by?: number;
  diagnosed_by_name?: string;
  diagnosed_at: string;
}

export interface Encounter {
  id: number;
  patient: EncounterPatientBrief;
  doctor: DoctorBrief;
  appointment?: number;
  chief_complaint: string;
  clinical_notes: string;
  discharge_summary: string;
  status: EncounterStatus;
  status_display: EncounterStatusDisplay;
  vitalsign?: VitalSign;
  diagnoses: Diagnosis[];
  prescriptions: any[]; // Placeholder for now
  lab_orders: any[]; // Placeholder for now
  radiology_orders: any[]; // Placeholder for now
  started_at: string;
  completed_at?: string;
}

export interface MedicalHistory {
  id: number;
  patient: number;
  condition_name: string;
  icd10_code: string;
  condition_type: MedicalHistoryType;
  condition_type_display: string;
  status: MedicalHistoryStatus;
  status_display: string;
  onset_date?: string;
  resolution_date?: string;
  notes: string;
  recorded_by?: number;
  recorded_by_name?: string;
  recorded_at: string;
  updated_at: string;
}
