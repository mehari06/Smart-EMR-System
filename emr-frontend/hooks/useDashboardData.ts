import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments';
import { clinicalApi } from '@/lib/api/clinical';
import { dashboardApi } from '@/lib/api/dashboard';
import { patientsApi } from '@/lib/api/patients';

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
};

export function useDashboardPatients(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'patients'],
    queryFn: () => patientsApi.list({ page_size: 500, registered_after: thirtyDaysAgo() }),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDashboardTodayAppointments(params?: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'appointments', today(), params ?? {}],
    queryFn: () => appointmentsApi.today(),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useDashboardAppointments(params?: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'appointments', params ?? {}],
    queryFn: () => appointmentsApi.list(params),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useDashboardEncounters(params?: { patient?: number; doctor?: number; status?: string }, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'encounters', params ?? {}],
    queryFn: () => clinicalApi.listEncounters(params),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useDashboardAuditLogs(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'auditLogs'],
    queryFn: () => dashboardApi.auditLogs({ page_size: 8, ordering: '-timestamp' }),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useDashboardLabOrders(params?: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'labOrders', params ?? {}],
    queryFn: () => dashboardApi.labOrders(params),
    enabled,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useDashboardPrescriptions(params?: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'prescriptions', params ?? {}],
    queryFn: () => dashboardApi.prescriptions(params),
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useDashboardRadiologyOrders(params?: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'radiologyOrders', params ?? {}],
    queryFn: () => dashboardApi.radiologyOrders(params),
    enabled,
    staleTime: 1000 * 60,
  });
}
