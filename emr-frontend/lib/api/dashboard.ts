import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse } from '@/types/api';

export interface AuditLog {
  id: number;
  user: number | null;
  user_email?: string;
  user_full_name?: string;
  action: string;
  model_name: string;
  object_id?: string;
  object_repr?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface LabOrder {
  id: number;
  encounter?: number;
  patient?: number;
  status: string;
  status_display?: string;
  ordered_at?: string;
  test?: {
    id: number;
    code?: string;
    name?: string;
  };
}

export interface Prescription {
  id: number;
  encounter?: number;
  status: string;
  status_display?: string;
  prescribed_at?: string;
  prescribed_by?: number;
  items?: Array<{
    id: number;
    medicine?: {
      id: number;
      name: string;
    };
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
}

export interface RadiologyOrder {
  id: number;
  encounter?: number;
  patient?: number;
  status: string;
  status_display?: string;
  ordered_at?: string;
  test?: {
    id: number;
    code?: string;
    name?: string;
  };
}

export const dashboardApi = {
  auditLogs: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/audit/', { params }).then((r) => r.data),

  labOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<LabOrder>>('/laboratory/orders', { params }).then((r) => r.data),

  prescriptions: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Prescription>>('/prescriptions', { params }).then((r) => r.data),

  radiologyOrders: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<RadiologyOrder>>('/clinical/radiology/orders', { params }).then((r) => r.data),
};
