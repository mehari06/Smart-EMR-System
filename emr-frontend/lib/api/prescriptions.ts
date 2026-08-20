import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse } from '@/types/api';
import type { Prescription, Medicine, CreatePrescriptionData } from '@/types/prescription';

export const prescriptionsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PaginatedResponse<Prescription>>('/prescriptions', { params }).then((r) => r.data),

  get: (id: number) =>
    apiClient.get<Prescription>(`/prescriptions/${id}`).then((r) => r.data),

  create: (data: CreatePrescriptionData) =>
    apiClient.post<Prescription>('/prescriptions', data).then((r) => r.data),

  /** Dispense a prescription (status → D) or cancel (status → X) */
  updateStatus: (id: number, status: 'D' | 'X') =>
    apiClient.patch<Prescription>(`/prescriptions/${id}`, { status }).then((r) => r.data),

  getMedicines: (search?: string) =>
    apiClient
      .get<Medicine[]>('/prescriptions/medicines', { params: search ? { search } : undefined })
      .then((r) => r.data),
};
