import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allergyApi } from '@/lib/api/allergies';
import { AllergyPayload, PatientAllergy } from '@/types/allergies';
import { toast } from 'sonner';

export const useAllergies = (patientId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['patientAllergies', patientId];

  const query = useQuery({
    queryKey,
    queryFn: () => allergyApi.getPatientAllergies(patientId),
    enabled: !!patientId,
  });
  const addMutation = useMutation({
    mutationFn: (data: AllergyPayload) => allergyApi.addPatientAllergy(data),
    onMutate: async (newAllergy) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousAllergies = queryClient.getQueryData<{ results: PatientAllergy[] }>(queryKey);

      if (previousAllergies) {
        // We do a pseudo-optimistic update since we don't have the full allergy object (like name)
        // A full optimistic update would require looking up the allergy name, but this is a simple approximation
        queryClient.setQueryData(queryKey, {
          ...previousAllergies,
          results: [...previousAllergies.results, { ...newAllergy, id: Math.random(), allergy_name: 'Loading...', severity_display: newAllergy.severity } as unknown as PatientAllergy],
        });
      }

      return { previousAllergies };
    },
    onSuccess: () => {
      toast.success('Allergy added successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, newAllergy, context) => {
      toast.error('Failed to add allergy');
      if (context?.previousAllergies) {
        queryClient.setQueryData(queryKey, context.previousAllergies);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => allergyApi.removePatientAllergy(id),
    onSuccess: () => {
      toast.success('Allergy removed');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error('Failed to remove allergy');
    },
  });

  return {
    ...query,
    addAllergy: addMutation,
    removeAllergy: removeMutation,
  };
};

export const useAllergySearch = (search: string) => {
  return useQuery({
    queryKey: ['allergySearch', search],
    queryFn: () => allergyApi.searchAllergies(search),
    enabled: search.length >= 3,
  });
};
