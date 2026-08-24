'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Activity, LockKeyhole } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import leftImage from '@/public/left.png';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await apiClient.post('/core/auth/login', data);
      const { user, access } = response.data;
      login(user, access);
      queryClient.clear();
      router.push('/dashboard');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.detail || 'Invalid credentials',
      });
    }
  };

    return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* LEFT PANEL - Image */}
      {/* LEFT PANEL */}
<div className="hidden lg:block w-[45%] shrink-0 min-h-screen relative">
  <Image
    src={leftImage}
    alt="Smart EMR"
    fill
    className="object-cover"
    priority
  />
</div>

      {/* RIGHT PANEL - Login form */}
      <div className="flex w-full lg:w-[55%] min-h-screen items-center justify-center px-4 sm:px-6 py-10">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex flex-col items-center gap-2">
                          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <Activity className="size-6" />
            </div>
              <div>
                <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Smart EMR
                </CardTitle>
                <CardDescription className="mt-2">Sign in to your clinical workspace</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-6 h-px bg-border" />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email">Email Address</label>
                <Input
                  id="email"
                  {...register('email')}
                  placeholder="Enter email address"
                  type="email"
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password">Password</label>
                <Input
                  id="password"
                  {...register('password')}
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {errors.root && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                  {errors.root.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : <><LockKeyhole className="size-4 mr-1" /> Sign In</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}