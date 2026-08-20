import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api/settings';
import {
  CreateStaffData,
  CreateDepartmentData,
  UpdateOrganizationData,
} from '@/types/settings';

export function useOrganizations() {
  return useQuery({
    queryKey: ['core', 'organizations'],
    queryFn: () => settingsApi.getOrganizations(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['core', 'departments'],
    queryFn: () => settingsApi.getDepartments(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStaffMembers() {
  return useQuery({
    queryKey: ['core', 'staff'],
    queryFn: () => settingsApi.getStaff(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffData) => settingsApi.createStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'staff'] });
      toast.success('Staff member created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create staff');
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStaffData> }) =>
      settingsApi.updateStaff(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'staff'] });
      toast.success('Staff member updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update staff');
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'staff'] });
      toast.success('Staff member deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete staff');
    },
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentData) => settingsApi.createDepartment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'departments'] });
      toast.success('Department created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create department');
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDepartmentData> }) =>
      settingsApi.updateDepartment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'departments'] });
      toast.success('Department updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update department');
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'departments'] });
      toast.success('Department deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete department');
    },
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationData) => settingsApi.createOrganization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'organizations'] });
      toast.success('Organization created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create organization');
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UpdateOrganizationData> }) =>
      settingsApi.updateOrganization(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'organizations'] });
      toast.success('Organization updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update organization');
    },
  });
}
export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => settingsApi.deleteOrganization(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['core', 'organizations'] });
      toast.success('Organization deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete organization');
    },
  });
}