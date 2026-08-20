import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queueApi } from '@/lib/api/queue';
import {
  PatientQueueItem,
  QueueStats,
  TriageAssessmentData,
  AssignDoctorData,
  AddToQueueData,
} from '@/types/queue';

export const queueKeys = {
  all: ['queue'] as const,
  lists: () => [...queueKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...queueKeys.lists(), params] as const,
  stats: () => [...queueKeys.all, 'stats'] as const,
  detail: (id: number) => [...queueKeys.all, id] as const,
  myQueue: () => [...queueKeys.all, 'my-queue'] as const,
};

export function useQueue(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: queueKeys.list(params ?? {}),
    queryFn: () => queueApi.list(params),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

export function useQueueStats() {
  return useQuery({
    queryKey: queueKeys.stats(),
    queryFn: () => queueApi.stats(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useMyQueue() {
  return useQuery({
    queryKey: queueKeys.myQueue(),
    queryFn: () => queueApi.myQueue(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });
}

export function useAddToQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToQueueData) => queueApi.add(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Patient added to queue');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to add patient');
    },
  });
}

export function useStartTriage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => queueApi.startTriage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Triage started');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to start triage');
    },
  });
}

export function useCompleteTriage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TriageAssessmentData }) =>
      queueApi.completeTriage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Triage completed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to complete triage');
    },
  });
}

export function useAssignDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignDoctorData }) =>
      queueApi.assignDoctor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Doctor assigned');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to assign doctor');
    },
  });
}

export function useStartConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => queueApi.startConsultation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Consultation started');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to start consultation');
    },
  });
}

export function useCompleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, disposition }: { id: number; disposition?: string }) =>
      queueApi.complete(id, disposition),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Visit completed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to complete visit');
    },
  });
}

export function useMarkLeft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      queueApi.markLeft(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Marked as left');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to mark as left');
    },
  });
}

export function useTransferPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transfer_to, reason }: { id: number; transfer_to: string; reason?: string }) =>
      queueApi.transfer(id, transfer_to, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queueKeys.all });
      toast.success('Patient transferred');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to transfer');
    },
  });
}