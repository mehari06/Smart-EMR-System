export interface Medicine {
  id: number;
  name: string;
  strength: string;
  form: string;
  description: string;
}

export interface PrescriptionItem {
  id: number;
  medicine: Medicine;
  medicine_id?: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

export type PrescriptionStatus = 'A' | 'D' | 'X';

export interface Prescription {
  id: number;
  encounter: number;
  prescribed_by: number;
  prescribed_by_name: string;
  status: PrescriptionStatus;
  status_display: string;
  instructions: string;
  prescribed_at: string;
  items: PrescriptionItem[];
  /** Simulated PIS dispatch info */
  pis_sent?: boolean;
}

export interface CreatePrescriptionItemData {
  medicine_id: number;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface CreatePrescriptionData {
  encounter: number;
  prescribed_by: number;
  instructions?: string;
  items: CreatePrescriptionItemData[];
}
