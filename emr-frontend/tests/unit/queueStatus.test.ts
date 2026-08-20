import { describe, it, expect } from 'vitest';
import { QUEUE_STATUS_LABELS, QUEUE_STATUS_COLORS, TRIAGE_LEVEL_COLORS } from '@/types/queue';

describe('Queue Status Constants', () => {
  it('has all 8 queue statuses', () => {
    expect(Object.keys(QUEUE_STATUS_LABELS)).toHaveLength(8);
  });

  it('has correct status labels', () => {
    expect(QUEUE_STATUS_LABELS.W).toBe('Waiting for Triage');
    expect(QUEUE_STATUS_LABELS.P).toBe('In Consultation');
    expect(QUEUE_STATUS_LABELS.C).toBe('Completed');
  });

  it('has colors for all statuses', () => {
    expect(Object.keys(QUEUE_STATUS_COLORS)).toHaveLength(8);
  });
});