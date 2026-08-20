import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const appointmentSchema = z.object({
  patient: z.number().min(1, 'Select a patient'),
  department: z.string().min(1, 'Select a department'),
  scheduled_at: z.string().min(1, 'Date required'),
  reason: z.string().min(3, 'Must be at least 3 characters'),
  notes: z.string().optional(),
});

describe('Appointment Validation', () => {
  it('accepts valid appointment', () => {
    const valid = {
      patient: 1,
      department: '1',
      scheduled_at: '2026-08-20T10:00:00',
      reason: 'Routine checkup',
      notes: '',
    };
    expect(() => appointmentSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing patient', () => {
    const invalid = {
      patient: 0,
      department: '1',
      scheduled_at: '2026-08-20T10:00:00',
      reason: 'Routine checkup',
    };
    expect(() => appointmentSchema.parse(invalid)).toThrow();
  });

  it('rejects missing department', () => {
    const invalid = {
      patient: 1,
      department: '',
      scheduled_at: '2026-08-20T10:00:00',
      reason: 'Routine checkup',
    };
    expect(() => appointmentSchema.parse(invalid)).toThrow();
  });

  it('rejects short reason', () => {
    const invalid = {
      patient: 1,
      department: '1',
      scheduled_at: '2026-08-20T10:00:00',
      reason: 'Hi',
    };
    expect(() => appointmentSchema.parse(invalid)).toThrow();
  });
});