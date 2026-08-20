import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from '@/lib/api/clinical';
import { Encounter } from '@/types/clinical';
import { toast } from 'sonner';

export const useEncounter = (id: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['encounter', id];

  const query = useQuery({
    queryKey,
    queryFn: () => clinicalApi.getEncounter(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Encounter>) => clinicalApi.updateEncounter(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    onError: () => {
      toast.error('Failed to save changes');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (data: { clinical_notes?: string; discharge_summary?: string }) => 
      clinicalApi.closeEncounter(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success('Encounter closed successfully');
    },
    onError: () => {
      toast.error('Failed to close encounter');
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => clinicalApi.reopenEncounter(id),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success('Encounter reopened successfully');
    },
    onError: () => {
      toast.error('Failed to reopen encounter');
    },
  });

  return {
    ...query,
    updateEncounter: updateMutation,
    closeEncounter: closeMutation,
    reopenEncounter: reopenMutation,
  };
};
