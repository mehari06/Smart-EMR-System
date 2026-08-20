import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from '@/lib/api/clinical';
import { VitalSign } from '@/types/clinical';
import { toast } from 'sonner';

export const useVitals = (encounterId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['vitals', encounterId];

  const query = useQuery({
    queryKey,
    queryFn: () => clinicalApi.getVitals(encounterId),
    enabled: !!encounterId,
  });

  const addMutation = useMutation({
    mutationFn: (data: Partial<VitalSign>) => clinicalApi.recordVitals({ ...data, encounter: encounterId }),
    onSuccess: () => {
      toast.success('Vitals recorded successfully');
      queryClient.invalidateQueries({ queryKey });
      // Invalidate encounter query as well to update the nested vitals object
      queryClient.invalidateQueries({ queryKey: ['encounter', encounterId] });
    },
    onError: () => {
      toast.error('Failed to record vitals');
    },
  });

  return {
    ...query,
    recordVitals: addMutation,
  };
};

export const usePatientVitalsHistory = (patientId: number) => {
  return useQuery({
    queryKey: ['patientVitalsHistory', patientId],
    queryFn: () => clinicalApi.getPatientVitalsHistory(patientId),
    enabled: !!patientId,
  });
};
