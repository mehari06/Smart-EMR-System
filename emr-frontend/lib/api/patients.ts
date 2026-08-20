import { apiClient } from '@/lib/api/client';
import {
  PatientListItem,
  PatientsResponse,
  CreatePatientData,
  UpdatePatientData,
  PatientDetail,
} from '@/types/patient';

export type {
  PatientListItem,
  PatientsResponse,
  CreatePatientData,
  UpdatePatientData,
  PatientDetail,
};

export const patientsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<PatientsResponse>('/patients', { params }).then((r) => r.data),

  get: (id: number) =>
    apiClient.get<PatientDetail>(`/patients/${id}`).then((r) => r.data),

  create: (data: CreatePatientData) =>
    apiClient.post('/patients', data).then((r) => r.data),

  update: (id: number, data: Partial<UpdatePatientData>) =>
    apiClient.patch<PatientDetail>(`/patients/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    apiClient.delete(`/patients/${id}`).then((r) => r.data),
};