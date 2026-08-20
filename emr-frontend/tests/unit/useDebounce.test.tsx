import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('updates after delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    );

    expect(result.current).toBe('first');

    rerender({ value: 'second' });
    
    // Should still be 'first' immediately
    expect(result.current).toBe('first');

    // After 300ms, should update
    await waitFor(() => {
      expect(result.current).toBe('second');
    }, { timeout: 1000 });
  });
});