import { describe, it, expect } from 'vitest';
import { FILE_TYPE_LABELS, FILE_TYPE_COLORS } from '@/types/attachment';

describe('File Type Constants', () => {
  it('has all 5 file types', () => {
    expect(Object.keys(FILE_TYPE_LABELS)).toHaveLength(5);
  });

  it('has correct labels', () => {
    expect(FILE_TYPE_LABELS.lab_report).toBe('Lab Report');
    expect(FILE_TYPE_LABELS.radiology_image).toBe('Radiology Image');
    expect(FILE_TYPE_LABELS.consent_form).toBe('Consent Form');
  });

  it('has colors for all file types', () => {
    expect(Object.keys(FILE_TYPE_COLORS)).toHaveLength(5);
  });
});