'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, LockKeyhole, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiClient.post('/core/auth/password-reset', { email });
      setIsSent(true);
    } catch (error: any) {
      console.error('Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <Activity className="size-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Forgot Password</CardTitle>
            <CardDescription className="mt-2">
              Enter your email to receive a reset link
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6">
                <LockKeyhole className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-3 font-semibold text-emerald-800">Check Your Email</p>
                <p className="mt-1 text-sm text-emerald-600">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Link href="/login">
                <Button type="button" variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}