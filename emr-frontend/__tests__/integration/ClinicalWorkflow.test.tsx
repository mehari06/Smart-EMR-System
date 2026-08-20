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

describe('Clinical Workflow Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('starts new encounter', async () => {
    server.use(
      http.post('/api/clinical/encounters', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          patient: { id: body.patient, full_name: 'John Doe' },
          chief_complaint: body.chief_complaint,
          status: 'O',
          status_display: 'Open',
        }, { status: 201 });
      })
    );

    // Test starting encounter from NewEncounterDialog
  });

  it('records vitals', async () => {
    server.use(
      http.post('/api/clinical/vitals', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          encounter: body.encounter,
          temperature: body.temperature,
          systolic_pressure: body.systolic_pressure,
          pulse_rate: body.pulse_rate,
        }, { status: 201 });
      })
    );

    // Test recording vitals
  });

  it('adds diagnosis', async () => {
    server.use(
      http.post('/api/clinical/diagnoses', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          encounter: body.encounter,
          icd10_code: body.icd10_code,
          description: body.description,
        }, { status: 201 });
      })
    );

    // Test adding diagnosis
  });
});