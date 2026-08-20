export type AttachmentFileType = 'lab_report' | 'radiology_image' | 'referral_letter' | 'consent_form' | 'other';

export interface FileAttachment {
  id: number;
  encounter: number | null;
  patient: number;
  patient_name: string;
  uploaded_by: number;
  uploaded_by_name: string;
  file: string;
  file_type: AttachmentFileType;
  file_type_display: string;
  description: string;
  uploaded_at: string;
}

export interface AttachmentUploadData {
  encounter?: number | null;
  patient?: number;
  file: File;
  file_type: AttachmentFileType;
  description?: string;
}

export const FILE_TYPE_LABELS: Record<AttachmentFileType, string> = {
  lab_report: 'Lab Report',
  radiology_image: 'Radiology Image',
  referral_letter: 'Referral Letter',
  consent_form: 'Consent Form',
  other: 'Other',
};

export const FILE_TYPE_COLORS: Record<AttachmentFileType, string> = {
  lab_report: 'bg-blue-100 text-blue-700 border-blue-200',
  radiology_image: 'bg-purple-100 text-purple-700 border-purple-200',
  referral_letter: 'bg-green-100 text-green-700 border-green-200',
  consent_form: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
};