import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const triageSchema = z.object({
  chief_complaint: z.string().min(3, 'Chief complaint is required'),
  triage_level: z.coerce.number().min(1).max(5),
  pain_score: z.coerce.number().min(0).max(10).optional(),
  doctor_id: z.coerce.number().min(1, 'Please select a doctor'),
});

describe('Triage Validation', () => {
  it('accepts valid triage', () => {
    const valid = {
      chief_complaint: 'Chest pain',
      triage_level: 2,
      pain_score: 7,
      doctor_id: 1,
    };
    expect(() => triageSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid triage level', () => {
    const invalid = {
      chief_complaint: 'Chest pain',
      triage_level: 6,
      pain_score: 7,
      doctor_id: 1,
    };
    expect(() => triageSchema.parse(invalid)).toThrow();
  });

  it('rejects pain score > 10', () => {
    const invalid = {
      chief_complaint: 'Chest pain',
      triage_level: 2,
      pain_score: 15,
      doctor_id: 1,
    };
    expect(() => triageSchema.parse(invalid)).toThrow();
  });
});