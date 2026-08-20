import { apiClient } from './client';

export const reportsApi = {
  getPatientVisitsPdf: (patientId: number) => {
    return apiClient.get(`/reports/patient/${patientId}/visits/pdf/`, {
      responseType: 'blob',
    }).then((response) => response.data);
  },

  getLabReportPdf: (patientId: number) => {
    return apiClient.get(`/reports/patient/${patientId}/lab/pdf/`, {
      responseType: 'blob',
    }).then((response) => response.data);
  },

  getRadiologyReportPdf: (patientId: number) => {
    return apiClient.get(`/reports/patient/${patientId}/radiology/pdf/`, {
      responseType: 'blob',
    }).then((response) => response.data);
  },

  getPrescriptionReportPdf: (patientId: number) => {
    return apiClient.get(`/reports/patient/${patientId}/prescriptions/pdf/`, {
      responseType: 'blob',
    }).then((response) => response.data);
  },

  getPatientVisitsExcel: (patientId: number) => {
    return apiClient.get(`/reports/patient/${patientId}/visits/excel/`, {
      responseType: 'blob',
    }).then((response) => response.data);
  },
};