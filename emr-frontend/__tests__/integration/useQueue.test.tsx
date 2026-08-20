import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';
import { useQueue, useQueueStats } from '@/hooks/useQueue';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useQueue Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('fetches queue stats', async () => {
    server.use(
      http.get('/api/queue/stats', () => {
        return HttpResponse.json({
          total_waiting: 5,
          waiting_for_triage: 2,
          triaged_waiting: 2,
          in_consultation: 1,
          emergency_cases: 1,
          by_triage_level: {
            level_1: 1,
            level_2: 0,
            level_3: 2,
            level_4: 1,
            level_5: 1,
            not_triaged: 0,
          },
          average_wait_minutes: 15,
          long_waiters: 1,
        });
      })
    );

    const { result } = renderHook(() => useQueueStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.total_waiting).toBe(5);
    expect(result.current.data?.emergency_cases).toBe(1);
  });

  it('fetches queue list', async () => {
    server.use(
      http.get('/api/queue', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 1,
              patient: { id: 1, patient_number: 'PAT-001', full_name: 'John Doe' },
              chief_complaint: 'Chest pain',
              triage_level: 2,
              triage_level_display: 'Level 2 - Emergent',
              current_status: 'W',
              status_display: 'Waiting for Triage',
              wait_time: 10,
              is_overdue: false,
              arrival_time: '2026-08-20T10:00:00Z',
            },
          ],
        });
      })
    );

    const { result } = renderHook(() => useQueue({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0].chief_complaint).toBe('Chest pain');
  });
});