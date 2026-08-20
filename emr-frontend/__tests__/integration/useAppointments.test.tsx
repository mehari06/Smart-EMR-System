import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';
import { useAppointments } from '@/hooks/useAppointments';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useAppointments Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('fetches appointments from API', async () => {
    server.use(
      http.get('/api/appointments', () => {
        return HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 1,
              patient: { id: 1, patient_number: 'PAT-001', full_name: 'John Doe', phone: '0912345678' },
              doctor: { id: 1, staff_id: 'DOC-001', full_name: 'Dr. Smith', specialization: 'General' },
              scheduled_at: '2026-08-20T10:00:00Z',
              reason: 'Checkup',
              status: 'S',
              status_display: 'Scheduled',
              created_at: '2026-08-19T10:00:00Z',
            },
            {
              id: 2,
              patient: { id: 2, patient_number: 'PAT-002', full_name: 'Jane Doe', phone: '0999999999' },
              doctor: null,
              scheduled_at: '2026-08-21T14:00:00Z',
              reason: 'Follow-up',
              status: 'S',
              status_display: 'Scheduled',
              created_at: '2026-08-19T11:00:00Z',
            },
          ],
        });
      })
    );

    const { result } = renderHook(() => useAppointments({ page: 1 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.count).toBe(2);
    expect(result.current.data?.results).toHaveLength(2);
    expect(result.current.data?.results[0].patient.full_name).toBe('John Doe');
  });

  it('handles API error', async () => {
    server.use(
      http.get('/api/appointments', () => {
        return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useAppointments({ page: 1 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});