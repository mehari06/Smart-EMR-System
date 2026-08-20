'use client';

import { useAuthStore } from '@/store/useAuthStore';
import QueueDashboard from './_views/QueueDashboard';

export default function QueuePage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? '';

  if (!['admin', 'doctor', 'nurse', 'receptionist'].includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">You don't have access to the queue.</p>
      </div>
    );
  }

  return <QueueDashboard />;
}