import { apiClient } from './client';
import { PaginatedResponse } from '@/types/api';

export interface LabTest {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface LabOrder {
  id: number;
  encounter: number;
  patient: number;
  ordered_by: number;
  test: LabTest;
  status: 'P' | 'S' | 'R' | 'X';
  clinical_notes: string;
  lms_order_id: string;
  result_text: string;
  result_received_at: string;
  ordered_at: string;
  verified_by: number | null;
  verified_by_name: string;
  verified_at: string | null;
  is_verified: boolean;
}

export const labApi = {
  listTests: async () => {
    const response = await apiClient.get<PaginatedResponse<LabTest>>('/laboratory/tests');
    return response.data;
  },

    listOrders: async (params?: { encounter?: number; patient?: number; ordering?: string }) => {
    const response = await apiClient.get<PaginatedResponse<LabOrder>>('/laboratory/orders', { params });
    return response.data;
  },
  

  createOrder: async (data: {
    encounter: number;
    patient: number;
    test: number;
    ordered_by: number;
    clinical_notes?: string;
  }) => {
    const response = await apiClient.post<LabOrder>('/laboratory/orders', data);
    return response.data;
  },
    downloadResult: async (orderId: number) => {
    const response = await apiClient.get(`/laboratory/orders/${orderId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
