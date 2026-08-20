'use client';

import { useAuthStore } from '@/store/useAuthStore';
import AdminAppointments from './_views/AdminAppointments';
import DoctorAppointments from './_views/DoctorAppointments';
import PatientAppointments from './_views/PatientAppointments';

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'patient';

  if (role === 'patient') return <PatientAppointments />;
  if (role === 'doctor' || role === 'nurse') return <DoctorAppointments />;
  // admin, staff_head, pharmacist, lab_tech → Admin view
  return <AdminAppointments />;
}
