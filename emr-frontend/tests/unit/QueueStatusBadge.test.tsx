import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueueStatusBadge } from '@/app/(authenticated)/queue/_components/QueueStatusBadge';

describe('QueueStatusBadge', () => {
  it('renders Waiting for Triage', () => {
    render(<QueueStatusBadge status="W" />);
    expect(screen.getByText('Waiting for Triage')).toBeInTheDocument();
  });

  it('renders In Triage', () => {
    render(<QueueStatusBadge status="T" />);
    expect(screen.getByText('In Triage')).toBeInTheDocument();
  });

  it('renders Completed', () => {
    render(<QueueStatusBadge status="C" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});