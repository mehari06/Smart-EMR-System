'use client';

import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';
import NurseDashboard from '@/components/dashboard/NurseDashboard';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import ReceptionistDashboard from '@/components/dashboard/ReceptionistDashboard';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role) as string | undefined;

  if (role === 'admin' || role === 'staff_head') return <AdminDashboard />;
  if (role === 'doctor') return <DoctorDashboard />;
  if (role === 'nurse') return <NurseDashboard />;
  if (role === 'patient') return <PatientDashboard />;
  if (role === 'receptionist') return <ReceptionistDashboard />;

  return <ReceptionistDashboard />;
}
