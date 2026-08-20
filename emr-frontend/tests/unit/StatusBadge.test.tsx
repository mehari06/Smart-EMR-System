import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/app/(authenticated)/appointments/_components/StatusBadge';

describe('StatusBadge', () => {
  it('renders Scheduled status', () => {
    render(<StatusBadge status="S" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('renders Checked In status', () => {
    render(<StatusBadge status="I" />);
    expect(screen.getByText('Checked In')).toBeInTheDocument();
  });
});