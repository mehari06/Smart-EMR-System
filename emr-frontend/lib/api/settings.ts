import { apiClient } from './client';
import { PaginatedResponse } from '@/types/api';
import {
  Organization,
  Department,
  StaffMember,
  CreateStaffData,
  CreateDepartmentData,
  UpdateOrganizationData,
} from '@/types/settings';

export const settingsApi = {
  // ── Organization ──────────────────────────────────────────
  getOrganizations: async () => {
    const response = await apiClient.get<PaginatedResponse<Organization>>('/core/organizations');
    return response.data;
  },

  createOrganization: async (data: UpdateOrganizationData) => {
    const response = await apiClient.post<Organization>('/core/organizations', data);
    return response.data;
  },

  updateOrganization: async (id: number, data: Partial<UpdateOrganizationData>) => {
    const response = await apiClient.patch<Organization>(`/core/organizations/${id}`, data);
    return response.data;
  },

  // ── Departments ───────────────────────────────────────────
  getDepartments: async () => {
    const response = await apiClient.get<PaginatedResponse<Department>>('/core/departments');
    return response.data;
  },

  createDepartment: async (data: CreateDepartmentData) => {
    const response = await apiClient.post<Department>('/core/departments', data);
    return response.data;
  },

  updateDepartment: async (id: number, data: Partial<CreateDepartmentData>) => {
    const response = await apiClient.patch<Department>(`/core/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: number) => {
    await apiClient.delete(`/core/departments/${id}`);
  },

  // ── Staff ─────────────────────────────────────────────────
  getStaff: async () => {
    const response = await apiClient.get<PaginatedResponse<StaffMember>>('/core/staff');
    return response.data;
  },

  createStaff: async (data: CreateStaffData) => {
    const response = await apiClient.post<StaffMember>('/core/staff', data);
    return response.data;
  },

  updateStaff: async (id: number, data: Partial<CreateStaffData>) => {
    const response = await apiClient.patch<StaffMember>(`/core/staff/${id}`, data);
    return response.data;
  },

  deleteStaff: async (id: number) => {
    await apiClient.delete(`/core/staff/${id}`);
  },
    deleteOrganization: async (id: number) => {
    await apiClient.delete(`/core/organizations/${id}`);
  },
};