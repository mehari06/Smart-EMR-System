import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from '@/lib/api/clinical';
import { Diagnosis } from '@/types/clinical';
import { toast } from 'sonner';

export const useDiagnoses = (encounterId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['diagnoses', encounterId];

  const query = useQuery({
    queryKey,
    queryFn: () => clinicalApi.getDiagnoses(encounterId),
    enabled: !!encounterId,
  });

  const addMutation = useMutation({
    mutationFn: (data: Partial<Diagnosis>) => clinicalApi.addDiagnosis({ ...data, encounter: encounterId }),
    onMutate: async (newDiagnosis) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ results: Diagnosis[] }>(queryKey);

      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          results: [...previous.results, { ...newDiagnosis, id: Math.random() } as Diagnosis],
        });
      }

      return { previous };
    },
    onSuccess: () => {
      toast.success('Diagnosis added');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, newDiagnosis, context) => {
      toast.error('Failed to add diagnosis');
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Diagnosis> }) => clinicalApi.updateDiagnosis(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ results: Diagnosis[] }>(queryKey);

      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          results: previous.results.map((d) => (d.id === id ? { ...d, ...data } : d)),
        });
      }

      return { previous };
    },
    onSuccess: () => {
      toast.success('Diagnosis updated');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, variables, context) => {
      toast.error('Failed to update diagnosis');
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    addDiagnosis: addMutation,
    updateDiagnosis: updateMutation,
  };
};
