import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';
import { PatientSearchSelect } from '@/app/(authenticated)/appointments/_components/PatientSearchSelect';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PatientSearchSelect Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('searches patients when typing', async () => {
    server.use(
      http.get('/api/patients', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 1,
              patient_number: 'PAT-000001',
              full_name: 'John Doe',
              phone: '0912345678',
              is_active: true,
            },
          ],
        });
      })
    );

    render(
      <PatientSearchSelect value={null} onChange={() => {}} />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText('Search patient by name or ID...');
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    server.use(
      http.get('/api/patients', () => {
        return HttpResponse.json({ count: 0, results: [] });
      })
    );

    render(
      <PatientSearchSelect value={null} onChange={() => {}} />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText('Search patient by name or ID...');
    fireEvent.change(input, { target: { value: 'Test' } });

    expect(screen.getByText(/Searching/i)).toBeInTheDocument();
  });

  it('shows "No patients found" when no results', async () => {
    server.use(
      http.get('/api/patients', () => {
        return HttpResponse.json({ count: 0, results: [] });
      })
    );

    render(
      <PatientSearchSelect value={null} onChange={() => {}} />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText('Search patient by name or ID...');
    fireEvent.change(input, { target: { value: 'Nobody' } });

    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeInTheDocument();
    });
  });
});