import { apiClient } from './client';
import { Allergy, PatientAllergy, AllergyPayload } from '@/types/allergies';
import { PaginatedResponse } from '@/types/api';

export const allergyApi = {
  /**
   * Search available allergies in the master catalogue.
   * @param search Query string (e.g. "pean")
   */
  searchAllergies: async (search: string) => {
    const response = await apiClient.get<PaginatedResponse<Allergy>>('/patients/allergies', {
      params: { search }
    });
    return response.data;
  },

  /**
   * Get all allergies for a specific patient.
   */
  getPatientAllergies: async (patientId: number) => {
    const response = await apiClient.get<PaginatedResponse<PatientAllergy>>('/patients/patient-allergies', {
      params: { patient: patientId }
    });
    return response.data;
  },

  /**
   * Add a new allergy record for a patient.
   */
  addPatientAllergy: async (data: AllergyPayload) => {
    const response = await apiClient.post<PatientAllergy>('/patients/patient-allergies', data);
    return response.data;
  },

  /**
   * Delete a patient allergy record.
   */
  removePatientAllergy: async (id: number) => {
    await apiClient.delete(`/patients/patient-allergies/${id}`);
  }
};
