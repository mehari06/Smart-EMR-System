'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableTableHeaderProps {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function SortableTableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: SortableTableHeaderProps) {
  const isActive = currentSort === column;
  
  return (
    <Button
      variant="ghost"
      className="h-auto p-0 text-xs font-semibold uppercase text-slate-500 hover:bg-transparent"
      onClick={() => onSort(column)}
    >
      {label}
      {isActive ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="ml-2 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-2 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-3 w-3" />
      )}
    </Button>
  );
}