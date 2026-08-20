import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 3,
      email: 'doctor@test.com',
      first_name: 'Doctor',
      last_name: 'Test',
      role: 'doctor',
      staff_profile_id: 1,
      staff_id: 'DOC-001',
    },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PrescriptionForm', () => {
  beforeEach(() => {
    queryClient.clear();
    
    server.use(
      http.get('/api/prescriptions', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );
  });

  it('renders prescription form', async () => {
    const { PrescriptionsTab } = await import('@/components/encounters/PrescriptionsTab');
    
    render(<PrescriptionsTab encounterId={1} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows empty state', async () => {
    const { PrescriptionsTab } = await import('@/components/encounters/PrescriptionsTab');
    
    render(<PrescriptionsTab encounterId={1} />, { wrapper });

    await waitFor(() => {
      const emptyMessages = screen.getAllByText(/No prescriptions yet/i);
      expect(emptyMessages.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
  });
});