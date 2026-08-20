import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';
import { CreateAppointmentModal } from '@/app/(authenticated)/appointments/_components/CreateAppointmentModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CreateAppointmentModal Integration', () => {
  beforeEach(() => {
    queryClient.clear();
    server.use(
      http.get('/api/core/departments', () => {
        return HttpResponse.json({
          count: 1,
          results: [{ id: 1, name: 'Cardiology' }],
        });
      }),
      http.get('/api/core/staff', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 1,
              staff_id: 'NUR-001',
              user: { id: 10, first_name: 'Nurse', last_name: 'Test', role: 'nurse', email: 'nurse@test.com', is_active: true },
            },
          ],
        });
      })
    );
  });

  it('renders the modal when clicked', async () => {
    render(<CreateAppointmentModal />, { wrapper });

    const button = screen.getByText('New Appointment');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Schedule New Appointment')).toBeInTheDocument();
    });
  });

  it('shows validation errors on empty submit', async () => {
    render(<CreateAppointmentModal />, { wrapper });

    fireEvent.click(screen.getByText('New Appointment'));

    await waitFor(() => {
      expect(screen.getByText('Schedule New Appointment')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Schedule Appointment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Select a patient')).toBeInTheDocument();
      expect(screen.getByText('Select a department')).toBeInTheDocument();
    });
  });

  it('loads departments and nurses when opened', async () => {
    render(<CreateAppointmentModal />, { wrapper });

    fireEvent.click(screen.getByText('New Appointment'));

    await waitFor(() => {
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
    });
  });
});