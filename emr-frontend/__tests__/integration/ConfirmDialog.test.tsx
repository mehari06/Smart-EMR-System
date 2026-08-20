import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog Integration', () => {
  it('renders dialog when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Patient?"
        description="This action cannot be undone"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Delete Patient?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm clicked', () => {
    const mockConfirm = vi.fn();
    
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete Patient?"
        description="Confirm deletion"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={mockConfirm}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete Patient?"
        description="Confirm"
        onConfirm={() => {}}
      />
    );

    expect(screen.queryByText('Delete Patient?')).not.toBeInTheDocument();
  });
});