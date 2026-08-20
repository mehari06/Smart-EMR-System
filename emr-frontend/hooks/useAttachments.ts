import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attachmentsApi } from '@/lib/api/attachments';
import { AttachmentUploadData } from '@/types/attachment';

export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...attachmentKeys.lists(), params] as const,
};

export function useAttachments(params?: { patient?: number; encounter?: number }) {
  return useQuery({
    queryKey: attachmentKeys.list(params ?? {}),
    queryFn: () => attachmentsApi.list(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AttachmentUploadData) => attachmentsApi.upload(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.all });
      toast.success('File uploaded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to upload file');
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attachmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.all });
      toast.success('File deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete file');
    },
  });
}