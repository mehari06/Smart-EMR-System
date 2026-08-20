import { apiClient } from './client';
import { 
  PatientQueueItem, 
  QueueStats, 
  TriageAssessmentData,
  AssignDoctorData,
  AddToQueueData
} from '@/types/queue';
import { PaginatedResponse } from '@/types/api';

export const queueApi = {
  list: async (params?: { doctor?: number; triage_level?: number; current_status?: string }) => {
    const response = await apiClient.get<PaginatedResponse<PatientQueueItem>>('/queue', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get<PatientQueueItem>(`/queue/${id}`);
    return response.data;
  },

  add: async (data: AddToQueueData) => {
    const response = await apiClient.post<PatientQueueItem>('/queue', data);
    return response.data;
  },

  startTriage: async (id: number) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/start-triage`, {});
    return response.data;
  },

  completeTriage: async (id: number, data: TriageAssessmentData) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/complete-triage`, data);
    return response.data;
  },

  assignDoctor: async (id: number, data: AssignDoctorData) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/assign-doctor`, data);
    return response.data;
  },

  startConsultation: async (id: number) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/start-consultation`, {});
    return response.data;
  },

  complete: async (id: number, disposition?: string) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/complete`, { disposition });
    return response.data;
  },

  markLeft: async (id: number, reason: string) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/mark-left`, { reason });
    return response.data;
  },

  transfer: async (id: number, transfer_to: string, reason?: string) => {
    const response = await apiClient.post<PatientQueueItem>(`/queue/${id}/transfer`, { 
      transfer_to, 
      reason 
    });
    return response.data;
  },

  stats: async () => {
    const response = await apiClient.get<QueueStats>('/queue/stats');
    return response.data;
  },

  myQueue: async () => {
    const response = await apiClient.get<PatientQueueItem[]>('/queue/my-queue');
    return response.data;
  },
};