import { PatientAllergy } from './allergies';

export interface EmbeddedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
}

export interface PatientListItem {
  id: number;
  patient_number: string;
  full_name: string;
  email: string;
  phone: string;
  gender: 'M' | 'F' | 'O';
  gender_display: string;
  blood_group: string;
  blood_group_display: string;
  is_active: boolean;
  registered_at: string;
}

export interface PatientDetail {
  id: number;
  patient_number: string;
  user: EmbeddedUser;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  gender_display: string;
  blood_group: string;
  blood_group_display: string;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  profile_photo: string | null;
  is_active: boolean;
  allergies: PatientAllergy[];
  registered_at: string;
  updated_at: string;
}

// Alias for backward compatibility with existing components
export type Patient = PatientDetail;

export interface CreatePatientData {
  email: string;
  password?: string; // write_only
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  blood_group?: string;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface UpdatePatientData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'O';
  blood_group?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active?: boolean;
}

export interface PatientsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PatientListItem[];
}