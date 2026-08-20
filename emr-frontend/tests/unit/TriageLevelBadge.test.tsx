import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TriageLevelBadge } from '@/app/(authenticated)/queue/_components/TriageLevelBadge';

describe('TriageLevelBadge', () => {
  it('renders Level 1 (Immediate)', () => {
    render(<TriageLevelBadge level={1} />);
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
  });

  it('renders Level 3 (Urgent)', () => {
    render(<TriageLevelBadge level={3} />);
    expect(screen.getByText(/Level 3/)).toBeInTheDocument();
  });

  it('renders Not Triaged for null', () => {
    render(<TriageLevelBadge level={null} />);
    expect(screen.getByText('Not Triaged')).toBeInTheDocument();
  });
});