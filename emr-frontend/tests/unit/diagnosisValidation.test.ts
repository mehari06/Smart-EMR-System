import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const diagnosisSchema = z.object({
  icd10_code: z.string().min(2, 'ICD-10 code required').max(20),
  description: z.string().min(3, 'Description required').max(255),
  order: z.enum(['P', 'S']),
  certainty: z.enum(['C', 'P']),
  diag_status: z.enum(['A', 'R']),
});

describe('Diagnosis Validation', () => {
  it('accepts valid diagnosis', () => {
    const valid = {
      icd10_code: 'J20.9',
      description: 'Acute bronchitis',
      order: 'P',
      certainty: 'C',
      diag_status: 'A',
    };
    expect(() => diagnosisSchema.parse(valid)).not.toThrow();
  });

  it('rejects short ICD-10 code', () => {
    const invalid = {
      icd10_code: 'J',
      description: 'Acute bronchitis',
      order: 'P',
      certainty: 'C',
      diag_status: 'A',
    };
    expect(() => diagnosisSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid order', () => {
    const invalid = {
      icd10_code: 'J20.9',
      description: 'Acute bronchitis',
      order: 'X',
      certainty: 'C',
      diag_status: 'A',
    };
    expect(() => diagnosisSchema.parse(invalid)).toThrow();
  });
});