import { describe, it, expect } from 'vitest';
import { calculateAge } from '@/lib/utils/date';

describe('calculateAge', () => {
  it('calculates age correctly for a past date', () => {
    const age = calculateAge('2000-01-01');
    expect(age).toBeGreaterThan(20);
    expect(age).toBeLessThan(30);
  });

  it('returns 0 for undefined date', () => {
    expect(calculateAge(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(calculateAge('')).toBe(0);
  });
});