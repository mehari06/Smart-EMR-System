import { describe, it, expect } from 'vitest';
import { formatDateTime } from '@/components/dashboard/DashboardShared';

describe('formatDateTime', () => {
  it('returns dash for empty value', () => {
    expect(formatDateTime()).toBe('-');
    expect(formatDateTime(undefined)).toBe('-');
  });

  it('formats date string correctly', () => {
    const result = formatDateTime('2026-01-15T10:00:00');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});