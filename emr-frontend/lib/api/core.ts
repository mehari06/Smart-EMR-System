import { apiClient } from './client';
import { PaginatedResponse } from '@/types/api';

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
  description: string;
}

export interface Staff {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
  staff_id: string;
  department: number;
  specialization: string;
  license_number: string;
  is_active: boolean;
  joined_at: string;
}

export const coreApi = {
  getOrganizations: async () => {
    const response = await apiClient.get<PaginatedResponse<Organization>>('/core/organizations');
    return response.data;
  },

  getDepartments: async () => {
    const response = await apiClient.get<PaginatedResponse<Department>>('/core/departments');
    return response.data;
  },

  getStaff: async () => {
    const response = await apiClient.get<PaginatedResponse<Staff>>('/core/staff');
    return response.data;
  },

  changePassword: async (data: { old_password: string; new_password: string }) => {
    const response = await apiClient.post<{ detail: string }>('/core/auth/change-password', data);
    return response.data;
  },
};