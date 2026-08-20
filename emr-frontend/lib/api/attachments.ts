import { apiClient } from './client';
import { FileAttachment, AttachmentUploadData } from '@/types/attachment';
import { PaginatedResponse } from '@/types/api';

export const attachmentsApi = {
  list: async (params?: { patient?: number; encounter?: number; file_type?: string }) => {
    const response = await apiClient.get<PaginatedResponse<FileAttachment>>('/attachments', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await apiClient.get<FileAttachment>(`/attachments/${id}`);
    return response.data;
  },

  upload: async (data: AttachmentUploadData) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('file_type', data.file_type);
    
    if (data.patient) {
      formData.append('patient', String(data.patient));
    }
    
    if (data.encounter) {
      formData.append('encounter', String(data.encounter));
    }
    
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post<FileAttachment>('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/attachments/${id}`);
  },

  downloadUrl: (id: number) => `/attachments/${id}/download`,
};