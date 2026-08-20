'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  Activity,
  UserCircle,
  ListOrdered,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const allMenuItems = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_tech', 'staff_head'] },
  { label: 'Patients',      href: '/patients',       icon: Users,           roles: ['admin', 'doctor', 'nurse', 'receptionist', 'staff_head'] },
  { label: 'Appointments',  href: '/appointments',   icon: Calendar,        roles: ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'staff_head'] },
  { label: 'Encounters',    href: '/encounters',     icon: ClipboardList,   roles: ['admin', 'doctor', 'nurse'] },
  { label: 'Vitals',        href: '/vitals',         icon: Activity,        roles: ['admin', 'nurse'] },
  { label: 'Profile',       href: '/profile',        icon: UserCircle,      roles: ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_tech', 'staff_head'] },
  { label: 'Settings',      href: '/settings',       icon: Settings,        roles: ['admin', 'staff_head'] },
  { label: 'Queue',         href: '/queue',          icon: ListOrdered,     roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { label: 'Lab Results', href: '/lab-results', icon: FlaskConical, roles: ['patient', 'admin', 'doctor'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? 'patient';

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card text-card-foreground shadow-sm transition-all flex flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Activity className="size-5" />
          </div>
          <div>
            <span className="block text-base font-semibold text-slate-900 dark:text-slate-100">Smart EMR</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Clinical workspace</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-3" aria-label="Primary navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-accent hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50',
                isActive && 'bg-primary text-white shadow-sm hover:bg-primary hover:text-white dark:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold dark:bg-slate-800 dark:text-slate-300">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs text-slate-500 capitalize">{role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}