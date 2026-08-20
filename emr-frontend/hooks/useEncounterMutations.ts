import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from '@/lib/api/clinical';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useStartEncounter = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { patientId: number; doctorId?: number; appointmentId?: number; reason?: string }) => {
      if (data.appointmentId) {
        const existing = await clinicalApi.listEncounters({ patient: data.patientId });
        const encounter = existing.results.find((item) => item.appointment === data.appointmentId);
        if (encounter) return encounter;
      }

      const payload: any = {
        patient: data.patientId,
        appointment: data.appointmentId,
        chief_complaint: data.reason || 'Routine Checkup',
      };

      return await clinicalApi.createEncounter(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.push(`/patients/${data.patient.id}/encounter/${data.id}/summary`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to open encounter');
    },
  });
};