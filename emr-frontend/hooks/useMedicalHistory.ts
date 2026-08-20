import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from '@/lib/api/clinical';
import { MedicalHistory } from '@/types/clinical';
import { toast } from 'sonner';

export const useMedicalHistory = (patientId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['medicalHistory', patientId];

  const query = useQuery({
    queryKey,
    queryFn: () => clinicalApi.getMedicalHistory(patientId),
    enabled: !!patientId,
  });

  const addMutation = useMutation({
    mutationFn: (data: Partial<MedicalHistory>) => clinicalApi.addMedicalHistory({ ...data, patient: patientId }),
    onSuccess: () => {
      toast.success('Medical history added');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error('Failed to add medical history');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MedicalHistory> }) => 
      clinicalApi.updateMedicalHistory(id, data),
    onSuccess: () => {
      toast.success('Medical history updated');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error('Failed to update medical history');
    },
  });

  return {
    ...query,
    addMedicalHistory: addMutation,
    updateMedicalHistory: updateMutation,
  };
};
