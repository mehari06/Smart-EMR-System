// import { apiClient } from '@/lib/api/client';
// import type {
//   AppointmentsResponse,
//   AppointmentDetail,
//   CreateAppointmentData,
//   RescheduleData,
//   CancelData,
//   AssignDoctorData,
//   AppointmentListItem,
// } from '@/types/appointments';

// // No trailing slashes — avoids Next.js 308 redirect loop
// export const appointmentsApi = {
//   list: (params?: Record<string, string | number | undefined>) =>
//     apiClient.get<AppointmentsResponse>('/appointments', { params }).then((r) => r.data),

//   today: () =>
//     apiClient.get<AppointmentListItem[]>('/appointments/today').then((r) => r.data),

//   get: (id: number) =>
//     apiClient.get<AppointmentDetail>(`/appointments/${id}`).then((r) => r.data),

//   create: (data: CreateAppointmentData) =>
//     apiClient.post<AppointmentDetail>('/appointments', data).then((r) => r.data),

//   update: (id: number, data: Partial<CreateAppointmentData>) =>
//     apiClient.patch<AppointmentDetail>(`/appointments/${id}`, data).then((r) => r.data),

//   delete: (id: number) =>
//     apiClient.delete(`/appointments/${id}`).then((r) => r.data),

//   reschedule: (id: number, data: RescheduleData) =>
//     apiClient.post<AppointmentDetail>(`/appointments/${id}/reschedule`, data).then((r) => r.data),

//   cancel: (id: number, data?: CancelData) =>
//     apiClient.post<AppointmentDetail>(`/appointments/${id}/cancel`, data ?? {}).then((r) => r.data),

//   assignDoctor: (id: number, data: AssignDoctorData) =>
//     apiClient.post<AppointmentDetail>(`/appointments/${id}/assign_doctor`, data).then((r) => r.data),

//   checkin: (id: number) =>
//     apiClient.post<AppointmentDetail>(`/appointments/${id}/checkin`, {}).then((r) => r.data),
// };
import { apiClient } from '@/lib/api/client';
import type {
  AppointmentsResponse,
  AppointmentDetail,
  CreateAppointmentData,
  RescheduleData,
  CancelData,
  AssignDoctorData,
  AppointmentListItem,
  TriageData,
} from '@/types/appointments';

export const appointmentsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<AppointmentsResponse>('/appointments', { params }).then((r) => r.data),

  today: () =>
    apiClient.get<AppointmentListItem[]>('/appointments/today').then((r) => r.data),

  get: (id: number) =>
    apiClient.get<AppointmentDetail>(`/appointments/${id}`).then((r) => r.data),

  create: (data: CreateAppointmentData) =>
    apiClient.post<AppointmentDetail>('/appointments', data).then((r) => r.data),

  update: (id: number, data: Partial<CreateAppointmentData>) =>
    apiClient.patch<AppointmentDetail>(`/appointments/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/appointments/${id}`).then((r) => r.data),

  reschedule: (id: number, data: RescheduleData) =>
    apiClient.post<AppointmentDetail>(`/appointments/${id}/reschedule`, data).then((r) => r.data),

  cancel: (id: number, data?: CancelData) =>
    apiClient.post<AppointmentDetail>(`/appointments/${id}/cancel`, data ?? {}).then((r) => r.data),

  assignDoctor: (id: number, data: AssignDoctorData) =>
    apiClient.post<AppointmentDetail>(`/appointments/${id}/assign_doctor`, data).then((r) => r.data),

  checkin: (id: number) =>
    apiClient.post<AppointmentDetail>(`/appointments/${id}/checkin`, {}).then((r) => r.data),
  triage: (id: number, data: TriageData) =>
    apiClient.post<AppointmentDetail>(`/appointments/${id}/triage`, data).then((r) => r.data),
};
