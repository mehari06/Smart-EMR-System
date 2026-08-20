'use client';

import { cn } from '@/lib/utils';
import { QUEUE_STATUS_LABELS, QUEUE_STATUS_COLORS, type QueueStatus } from '@/types/queue';

interface QueueStatusBadgeProps {
  status: QueueStatus;
  className?: string;
}

export function QueueStatusBadge({ status, className }: QueueStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        QUEUE_STATUS_COLORS[status],
        className
      )}
    >
      {QUEUE_STATUS_LABELS[status]}
    </span>
  );
}