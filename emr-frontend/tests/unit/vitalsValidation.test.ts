import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const vitalsSchema = z.object({
  temperature: z.coerce.number().min(30, 'Too low').max(45, 'Too high'),
  systolic_pressure: z.coerce.number().min(50).max(250),
  diastolic_pressure: z.coerce.number().min(30).max(150),
  pulse_rate: z.coerce.number().min(30).max(220),
  respiratory_rate: z.coerce.number().min(8).max(60),
  oxygen_saturation: z.coerce.number().min(50).max(100),
  height: z.coerce.number().min(20).max(250),
  weight: z.coerce.number().min(1).max(300),
});

describe('Vitals Validation', () => {
  it('accepts normal vitals', () => {
    const valid = {
      temperature: 36.5,
      systolic_pressure: 120,
      diastolic_pressure: 80,
      pulse_rate: 72,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      height: 170,
      weight: 70,
    };
    expect(() => vitalsSchema.parse(valid)).not.toThrow();
  });

  it('rejects fever > 45°C', () => {
    const invalid = {
      temperature: 50,
      systolic_pressure: 120,
      diastolic_pressure: 80,
      pulse_rate: 72,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      height: 170,
      weight: 70,
    };
    expect(() => vitalsSchema.parse(invalid)).toThrow();
  });

  it('rejects abnormal blood pressure', () => {
    const invalid = {
      temperature: 36.5,
      systolic_pressure: 300,
      diastolic_pressure: 80,
      pulse_rate: 72,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      height: 170,
      weight: 70,
    };
    expect(() => vitalsSchema.parse(invalid)).toThrow();
  });
});