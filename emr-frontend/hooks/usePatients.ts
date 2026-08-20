import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, type CreatePatientData, type PatientListItem } from '@/lib/api/patients';
import { toast } from 'sonner';

export const usePatients = (params?: Record<string, string | number>) => {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
};

export const usePatient = (id: number | null) => {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientData) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create patient');
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePatientData> }) =>
      patientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update patient');
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patientsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to deactivate patient');
    },
  });
};