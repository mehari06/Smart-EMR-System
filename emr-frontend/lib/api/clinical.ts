import { apiClient } from './client';
import { Encounter, VitalSign, Diagnosis, MedicalHistory } from '@/types/clinical';
import { PaginatedResponse } from '@/types/api';

export const clinicalApi = {
  // ── Encounters ────────────────────────────────────────────────────────

  listEncounters: async (params?: { patient?: number; doctor?: number; status?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Encounter>>('/clinical/encounters', { params });
    return response.data;
  },

  getEncounter: async (id: number) => {
    const response = await apiClient.get<Encounter>(`/clinical/encounters/${id}`);
    return response.data;
  },

  createEncounter: async (data: {
    patient: number;
    doctor?: number;
    appointment?: number;
    chief_complaint: string;
  }) => {
    const response = await apiClient.post<Encounter>('/clinical/encounters', data);
    return response.data;
  },

  updateEncounter: async (id: number, data: Partial<Encounter>) => {
    const response = await apiClient.patch<Encounter>(`/clinical/encounters/${id}`, data);
    return response.data;
  },

  closeEncounter: async (id: number, data: { clinical_notes?: string; discharge_summary?: string }) => {
    const response = await apiClient.post<Encounter>(`/clinical/encounters/${id}/close`, data);
    return response.data;
  },

  /**
   * Reopen a completed encounter so clinicians can add more notes/vitals.
   * Maps to the new POST /clinical/encounters/{id}/reopen backend endpoint.
   */
  reopenEncounter: async (id: number) => {
    const response = await apiClient.post<Encounter>(`/clinical/encounters/${id}/reopen`, {});
    return response.data;
  },

  // ── Vitals ────────────────────────────────────────────────────────────

  /**
   * Get vital signs for an encounter.
   * The backend VitalSign model is OneToOne with Encounter, so at most
   * one set of vitals is returned via the paginated list endpoint.
   */
  getVitals: async (encounterId: number) => {
    const response = await apiClient.get<PaginatedResponse<VitalSign>>('/clinical/vitals', {
      params: { encounter: encounterId },
    });
    return response.data;
  },

  getPatientVitalsHistory: async (patientId: number) => {
    // Fetch encounters for the patient and extract vitals from each
    const response = await apiClient.get<PaginatedResponse<Encounter>>('/clinical/encounters', {
      params: { patient: patientId, page_size: 50 },
    });
    const vitals = response.data.results
      .filter((enc) => enc.vitalsign)
      .map((enc) => enc.vitalsign as VitalSign)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    return vitals;
  },

  /**
   * Record new vitals for an encounter.
   * The encounterId is injected by the hook — do NOT include it in data.
   */
  recordVitals: async (data: Partial<VitalSign>) => {
    const response = await apiClient.post<VitalSign>('/clinical/vitals', data);
    return response.data;
  },

  // ── Diagnoses ─────────────────────────────────────────────────────────

  getDiagnoses: async (encounterId: number) => {
    const response = await apiClient.get<PaginatedResponse<Diagnosis>>('/clinical/diagnoses', {
      params: { encounter: encounterId },
    });
    return response.data;
  },

  addDiagnosis: async (data: Partial<Diagnosis>) => {
    const response = await apiClient.post<Diagnosis>('/clinical/diagnoses', data);
    return response.data;
  },

  updateDiagnosis: async (id: number, data: Partial<Diagnosis>) => {
    const response = await apiClient.patch<Diagnosis>(`/clinical/diagnoses/${id}`, data);
    return response.data;
  },

  deleteDiagnosis: async (id: number) => {
    const response = await apiClient.delete(`/clinical/diagnoses/${id}`);
    return response.data;
  },

  // ── Medical History ───────────────────────────────────────────────────

  getMedicalHistory: async (patientId: number) => {
    const response = await apiClient.get<PaginatedResponse<MedicalHistory>>('/clinical/history', {
      params: { patient: patientId },
    });
    return response.data;
  },

  addMedicalHistory: async (data: Partial<MedicalHistory>) => {
    const response = await apiClient.post<MedicalHistory>('/clinical/history', data);
    return response.data;
  },

  updateMedicalHistory: async (id: number, data: Partial<MedicalHistory>) => {
    const response = await apiClient.patch<MedicalHistory>(`/clinical/history/${id}`, data);
    return response.data;
  },

  // ── Radiology ─────────────────────────────────────────────────────────

  listRadiologyTests: async () => {
    const response = await apiClient.get<PaginatedResponse<{ id: number; name: string; code: string }>>('/clinical/radiology/tests');
    return response.data;
  },

  listRadiologyOrders: async (params?: { encounter?: number; patient?: number }) => {
    const response = await apiClient.get<PaginatedResponse<{
      id: number; encounter: number; patient: number; test: { id: number; name: string; code: string };
      status: string; clinical_notes: string; result_text: string; ordered_at: string;
    }>>('/clinical/radiology/orders', { params });
    return response.data;
  },

  createRadiologyOrder: async (data: {
    encounter: number; patient: number; test: number; ordered_by: number; clinical_notes: string;
  }) => {
    const response = await apiClient.post('/clinical/radiology/orders', data);
    return response.data;
  },
};
