import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'patient' | 'pharmacist' | 'lab_tech' | 'receptionist' | 'staff_head';
  staff_profile_id?: number | null;
  staff_id?: string | null;
  patient_profile_id?: number | null;

}

export function getInitials(user: User | null): string {
  if (!user) return '?';
  const f = user.first_name?.[0] ?? '';
  const l = user.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export function getDisplayName(user: User | null): string {
  if (!user) return 'User';
  return `${user.first_name} ${user.last_name}`.trim() || user.email;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        // Always clear any stale cookie/state before setting the new session
        Cookies.remove('access_token');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
        // Store new token in cookie (for middleware and API client)
        Cookies.set('access_token', token, {
          expires: 1, // 1 day
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('access_token');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);