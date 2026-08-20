import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../vitest.setup';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Lab Order Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('fetches lab tests on open', async () => {
    server.use(
      http.get('/api/laboratory/tests', () => {
        return HttpResponse.json({
          count: 2,
          results: [
            { id: 1, name: 'Complete Blood Count', code: 'CBC', description: 'Blood test' },
            { id: 2, name: 'Basic Metabolic Panel', code: 'BMP', description: 'Metabolic test' },
          ],
        });
      })
    );

    // Render LabOrdersTab and verify tests load
  });

  it('creates lab order successfully', async () => {
    server.use(
      http.post('/api/laboratory/orders', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          encounter: body.encounter,
          patient: body.patient,
          test: { id: body.test, name: 'CBC', code: 'CBC' },
          status: 'R',
          result_text: 'All parameters normal',
        }, { status: 201 });
      })
    );

    // Submit lab order and verify success
  });
});