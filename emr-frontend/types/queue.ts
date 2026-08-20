export type QueueStatus = 'W' | 'T' | 'G' | 'A' | 'P' | 'C' | 'L' | 'F';
export type TriageLevel = 1 | 2 | 3 | 4 | 5;

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  W: 'Waiting for Triage',
  T: 'In Triage',
  G: 'Triaged - Waiting',
  A: 'Assigned to Doctor',
  P: 'In Consultation',
  C: 'Completed',
  L: 'Left Without Being Seen',
  F: 'Transferred',
};

export const QUEUE_STATUS_COLORS: Record<QueueStatus, string> = {
  W: 'bg-amber-100 text-amber-700 border-amber-200',
  T: 'bg-blue-100 text-blue-700 border-blue-200',
  G: 'bg-purple-100 text-purple-700 border-purple-200',
  A: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  P: 'bg-green-100 text-green-700 border-green-200',
  C: 'bg-slate-100 text-slate-600 border-slate-200',
  L: 'bg-red-100 text-red-700 border-red-200',
  F: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const TRIAGE_LEVEL_LABELS: Record<TriageLevel, string> = {
  1: 'Level 1 - Immediate',
  2: 'Level 2 - Emergent (< 15 min)',
  3: 'Level 3 - Urgent (< 60 min)',
  4: 'Level 4 - Semi-urgent (< 120 min)',
  5: 'Level 5 - Non-urgent (< 240 min)',
};

export const TRIAGE_LEVEL_COLORS: Record<TriageLevel, string> = {
  1: 'bg-red-100 text-red-800 border-red-300',
  2: 'bg-orange-100 text-orange-800 border-orange-300',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-green-100 text-green-800 border-green-300',
  5: 'bg-blue-100 text-blue-800 border-blue-300',
};

export interface PatientQueueItem {
  id: number;
  patient: {
    id: number;
    patient_number: string;
    full_name: string;
    email?: string;
    phone?: string;
    gender_display?: string;
  };
  chief_complaint: string;
  triage_level: TriageLevel | null;
  triage_level_display: string;
  current_status: QueueStatus;
  status_display: string;
  pain_score: number | null;
  is_fast_track: boolean;
  assigned_doctor: {
    id: number;
    full_name: string;
    specialization?: string;
  } | null;
  assigned_doctor_name: string;
  assigned_room: string;
  arrival_time: string;
  wait_time: number;
  is_overdue: boolean;
  estimated_wait_minutes: number | null;
  triaged_by: {
    id: number;
    full_name: string;
  } | null;
  triaged_by_name: string;
  events?: QueueEvent[];
  updated_at?: string;
  triage_started_at?: string;
  triage_completed_at?: string;
  doctor_assigned_at?: string;
  consultation_started_at?: string;
  completed_at?: string;
  actual_wait_minutes?: number;
  disposition?: string;
  left_reason?: string;
  temperature?: number | string | null;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  oxygen_saturation?: number | null;
  respiratory_rate?: number | null;
  triage_notes?: string;
}

export interface QueueEvent {
  id: number;
  from_status: QueueStatus | null;
  to_status: QueueStatus;
  changed_by_name: string;
  notes: string;
  created_at: string;
}

export interface QueueStats {
  total_waiting: number;
  waiting_for_triage: number;
  triaged_waiting: number;
  in_consultation: number;
  emergency_cases: number;
  by_triage_level: {
    level_1: number;
    level_2: number;
    level_3: number;
    level_4: number;
    level_5: number;
    not_triaged: number;
  };
  average_wait_minutes: number;
  long_waiters: number;
}

export interface TriageAssessmentData {
  chief_complaint: string;
  triage_level: TriageLevel;
  triage_notes?: string;
  pain_score?: number;
  temperature?: number;
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  is_fast_track?: boolean;
}

export interface AssignDoctorData {
  doctor_id: number;
  room?: string;
}

export interface AddToQueueData {
  patient_id: number;
  appointment_id?: number;
  chief_complaint?: string;
}