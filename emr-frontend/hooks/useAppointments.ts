import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appointmentsApi } from '@/lib/api/appointments';
import type {
  CreateAppointmentData,
  RescheduleData,
  CancelData,
  AssignDoctorData,
  TriageData,
} from '@/types/appointments';

// ── Query Keys ──────────────────────────────────────────────────────────
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...appointmentKeys.lists(), params] as const,
  today: () => [...appointmentKeys.all, 'today'] as const,
  detail: (id: number) => [...appointmentKeys.all, id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────

export function useAppointments(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: appointmentKeys.list(params ?? {}),
    queryFn: () => appointmentsApi.list(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (prev) => prev,
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: appointmentKeys.today(),
    queryFn: () => appointmentsApi.today(),
    staleTime: 1000 * 60 * 1, // 1 minute — refresh often
    refetchInterval: 1000 * 60 * 3, // auto-refresh every 3 min
  });
}

export function useAppointment(id: number | null) {
  return useQuery({
    queryKey: appointmentKeys.detail(id!),
    queryFn: () => appointmentsApi.get(id!),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentData) => appointmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment scheduled successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to schedule appointment';
      toast.error(msg);
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAppointmentData> }) =>
      appointmentsApi.update(id, data),
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(appt.id) });
      toast.success('Appointment updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update appointment');
    },
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RescheduleData }) =>
      appointmentsApi.reschedule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment rescheduled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to reschedule');
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: CancelData }) =>
      appointmentsApi.cancel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to cancel appointment');
    },
  });
}

export function useCheckinAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.checkin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Patient checked in');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Check-in failed');
    },
  });
}

export function useAssignDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignDoctorData }) =>
      appointmentsApi.assignDoctor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Doctor assigned');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to assign doctor');
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Appointment deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete appointment');
    },
  });

}
export function useTriageAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TriageData }) =>
      appointmentsApi.triage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Patient triaged successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Triage failed');
    },
  });
}
