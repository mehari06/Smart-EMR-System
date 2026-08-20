'use client';

import { cn } from '@/lib/utils';
import { TRIAGE_LEVEL_LABELS, TRIAGE_LEVEL_COLORS, type TriageLevel } from '@/types/queue';
import { AlertTriangle, Clock } from 'lucide-react';

interface TriageLevelBadgeProps {
  level: TriageLevel | null;
  className?: string;
  showLabel?: boolean;
}

export function TriageLevelBadge({ level, className, showLabel = true }: TriageLevelBadgeProps) {
  if (!level) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        <Clock className="h-3 w-3" />
        Not Triaged
      </span>
    );
  }

  const isEmergency = level <= 2;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        TRIAGE_LEVEL_COLORS[level],
        className
      )}
    >
      {isEmergency && <AlertTriangle className="h-3 w-3 animate-pulse" />}
      {showLabel ? TRIAGE_LEVEL_LABELS[level] : `Level ${level}`}
    </span>
  );
}