export interface Organization {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  organization: number;
  organization_name?: string;
  description: string;
}

export interface StaffMember {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    is_active: boolean;
  };
  staff_id: string;
  department: number | null;
  department_name?: string;
  specialization: string;
  license_number: string;
  is_active: boolean;
  joined_at: string;
}

export interface CreateStaffData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  staff_id: string;
  department?: number | null;
  specialization?: string;
  license_number?: string;
}

export interface CreateDepartmentData {
  name: string;
  organization: number;
  description?: string;
}

export interface UpdateOrganizationData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_tech: 'Lab Technician',
  receptionist: 'Receptionist',
  staff_head: 'Staff Head',
  patient: 'Patient',
};