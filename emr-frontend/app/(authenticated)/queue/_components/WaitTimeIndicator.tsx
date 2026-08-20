'use client';

import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitTimeIndicatorProps {
  waitMinutes: number;
  isOverdue: boolean;
  estimatedWait?: number | null;
  className?: string;
}

export function WaitTimeIndicator({ 
  waitMinutes, 
  isOverdue, 
  estimatedWait, 
  className 
}: WaitTimeIndicatorProps) {
  const formatWait = (minutes: number) => {
    if (minutes < 1) return 'Just arrived';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn(
        'flex items-center gap-1.5 text-sm font-medium',
        isOverdue ? 'text-red-600' : 'text-slate-600'
      )}>
        {isOverdue ? (
          <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
        ) : (
          <Clock className="h-4 w-4 text-slate-400" />
        )}
        <span>{formatWait(waitMinutes)}</span>
      </div>
      {estimatedWait && estimatedWait > 0 && (
        <p className="text-xs text-slate-400">
          Est: {formatWait(estimatedWait)}
        </p>
      )}
    </div>
  );
}