'use client';

import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { coreApi } from '@/lib/api/core';
import { getDisplayName, useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm the new password'),
}).refine((values) => values.new_password === values.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) => coreApi.changePassword({
      old_password: values.old_password,
      new_password: values.new_password,
    }),
    onSuccess: () => {
      toast.success('Password updated successfully');
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to update password');
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCircle className="size-5" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your signed-in identity and access role.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Name</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{getDisplayName(user)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Email</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200">{user?.email ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Role</p>
            <Badge variant="outline" className="mt-1 capitalize">{user?.role?.replace('_', ' ') ?? 'User'}</Badge>
          </div>
          {user?.staff_id && (
            <div>
              <p className="text-sm font-medium text-slate-500">Staff ID</p>
              <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-200">{user.staff_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Use a strong password that is not shared with other systems.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => changePasswordMutation.mutate(values))} className="space-y-4">
            <div>
              <label htmlFor="old_password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Current Password</label>
              <Input id="old_password" type="password" autoComplete="current-password" className="mt-1" {...form.register('old_password')} />
              {form.formState.errors.old_password && <p className="mt-1 text-xs text-danger">{form.formState.errors.old_password.message}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">New Password</label>
                <Input id="new_password" type="password" autoComplete="new-password" className="mt-1" {...form.register('new_password')} />
                {form.formState.errors.new_password && <p className="mt-1 text-xs text-danger">{form.formState.errors.new_password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
                <Input id="confirm_password" type="password" autoComplete="new-password" className="mt-1" {...form.register('confirm_password')} />
                {form.formState.errors.confirm_password && <p className="mt-1 text-xs text-danger">{form.formState.errors.confirm_password.message}</p>}
              </div>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}