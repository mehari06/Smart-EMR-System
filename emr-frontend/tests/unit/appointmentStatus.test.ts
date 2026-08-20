import { describe, it, expect } from 'vitest';
import { STATUS_LABELS, STATUS_COLORS, TRIAGE_LEVEL_LABELS } from '@/types/appointments';

describe('Appointment Status Constants', () => {
  it('has all 6 appointment statuses', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6);
  });

  it('has correct labels', () => {
    expect(STATUS_LABELS.S).toBe('Scheduled');
    expect(STATUS_LABELS.I).toBe('Checked In');
    expect(STATUS_LABELS.C).toBe('Completed');
    expect(STATUS_LABELS.X).toBe('Cancelled');
  });

  it('has colors for all statuses', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(6);
  });
});

describe('Triage Levels', () => {
  it('has 5 triage levels', () => {
    expect(Object.keys(TRIAGE_LEVEL_LABELS)).toHaveLength(5);
  });

  it('has correct triage labels', () => {
    expect(TRIAGE_LEVEL_LABELS[1]).toContain('Immediate');
    expect(TRIAGE_LEVEL_LABELS[3]).toContain('Urgent');
    expect(TRIAGE_LEVEL_LABELS[5]).toContain('Non-urgent');
  });
});