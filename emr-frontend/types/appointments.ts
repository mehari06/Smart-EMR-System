// ── Appointment Types ─────────────────────────────────────────────────

export type AppointmentStatus = 'S' | 'I' | 'G' | 'C' | 'X' | 'N';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  S: 'Scheduled',
  I: 'Checked In',
  G: 'Triaged',
  C: 'Completed',
  X: 'Cancelled',
  N: 'No Show',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  S: 'bg-blue-100 text-blue-700 border-blue-200',
  I: 'bg-amber-100 text-amber-700 border-amber-200',
  G: 'bg-purple-100 text-purple-700 border-purple-200',
  C: 'bg-green-100 text-green-700 border-green-200',
  X: 'bg-red-100 text-red-700 border-red-200',
  N: 'bg-slate-100 text-slate-600 border-slate-200',
};

export interface DoctorBrief {
  id: number;
  staff_id: string;
  full_name: string;
  specialization: string;
}

export interface PatientBrief {
  id: number;
  patient_number: string;
  full_name: string;
  phone: string;
}
export interface AppointmentListItem {
  id: number;
  patient: PatientBrief | null;
  doctor: DoctorBrief | null;
  triage_nurse?: DoctorBrief | null;
  department: number | null;
  scheduled_at: string;
  reason: string;
  status: AppointmentStatus;
  status_display: string;
  triage_level?: TriageLevel | null;
  triage_level_display?: string;
  chief_complaint?: string;
  triage_notes?: string;
  triaged_at?: string | null;
  created_at: string;
}

export interface AppointmentDetail extends AppointmentListItem {
  pain_score?: number | null;
  temperature?: string | number | null;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  oxygen_saturation?: number | null;
  respiratory_rate?: number | null;
  notes: string;
}

export interface AppointmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AppointmentListItem[];
}

export interface CreateAppointmentData {
  patient: number | null;
  doctor?: number | null;
  department: number | null;
  triage_nurse?: number | null;
  scheduled_at: string;
  reason: string;
  notes?: string;
}

export interface RescheduleData {
  scheduled_at: string;
  notes?: string;
}

export interface CancelData {
  notes?: string;
}

export interface AssignDoctorData {
  doctor_id: number;
  notes?: string;
}

// Calendar event shape for react-big-calendar
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentListItem;
}
// ── Triage Types ─────────────────────────────────────────────────────

export type TriageLevel = 1 | 2 | 3 | 4 | 5;

export interface TriageData {
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
  doctor_id: number;
}

export const TRIAGE_LEVEL_LABELS: Record<TriageLevel, string> = {
  1: 'Level 1 - Immediate',
  2: 'Level 2 - Emergent',
  3: 'Level 3 - Urgent',
  4: 'Level 4 - Semi-urgent',
  5: 'Level 5 - Non-urgent',
};

export const TRIAGE_LEVEL_COLORS: Record<TriageLevel, string> = {
  1: 'bg-red-100 text-red-800 border-red-300',
  2: 'bg-orange-100 text-orange-800 border-orange-300',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-green-100 text-green-800 border-green-300',
  5: 'bg-blue-100 text-blue-800 border-blue-300',
};