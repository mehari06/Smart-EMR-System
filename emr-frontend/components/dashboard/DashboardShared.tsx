'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{children}</div>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'teal',
  trend,
  chartData,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'teal' | 'blue' | 'amber' | 'green' | 'rose' | 'slate' | 'purple' | 'indigo';
  trend?: { value: number; isPositive: boolean };
  chartData?: any[];
}) {
  const tones = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', fill: '#0d9488', stroke: '#0f766e' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', fill: '#2563eb', stroke: '#1d4ed8' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', fill: '#d97706', stroke: '#b45309' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', fill: '#059669', stroke: '#047857' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', fill: '#e11d48', stroke: '#be123c' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', fill: '#475569', stroke: '#334155' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', fill: '#9333ea', stroke: '#7e22ce' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', fill: '#4f46e5', stroke: '#4338ca' },
  };

  const currentTone = tones[tone];

  return (
    <Card className="relative overflow-hidden border-0 shadow-[0_2px_10px_rgba(0,0,0,0.06)] rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between pt-5 px-5 pb-0">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2.5 ${currentTone.bg}`}>
            <Icon className={`size-5 ${currentTone.text}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
        {trend && (
          <Badge variant="outline" className={`font-semibold border-none ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </Badge>
        )}
      </div>

      <div className="h-12 w-full mt-auto -mx-5 -mb-1 relative px-5">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentTone.fill} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={currentTone.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={currentTone.stroke} 
                strokeWidth={2} 
                fill={`url(#gradient-${tone})`} 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full border-t border-slate-100 dark:border-slate-800" />
        )}
      </div>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function QueryState({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  errorText,
  children,
  skeletonClassName = 'h-56',
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  emptyText: string;
  errorText: string;
  children: React.ReactNode;
  skeletonClassName?: string;
}) {
  if (isLoading) return <Skeleton className={`${skeletonClassName} w-full rounded-xl`} />;

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
        <AlertCircle className="size-4" />
        {errorText}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return <>{children}</>;
}

export function SortableHeader({ label, column }: { label: string; column: any }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto p-0 text-xs font-semibold uppercase text-slate-500 hover:bg-transparent"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 size-3" />
    </Button>
  );
}

export function DashboardDataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Filter table...',
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  searchPlaceholder?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageLabel = useMemo(() => {
    const total = table.getFilteredRowModel().rows.length;
    if (total === 0) return 'No rows';
    return `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount() || 1} · ${total} rows`;
  }, [table]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          className="sm:max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <SlidersHorizontal className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                className="capitalize"
              >
                {column.id.replaceAll('_', ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No matching rows.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{pageLabel}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlertPanel({
  alerts,
}: {
  alerts: { id: string | number; message: string; timestamp: string; severity?: 'warning' | 'critical' }[];
}) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <Card className="border-rose-200 bg-rose-50/50 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-rose-800 dark:text-rose-400 flex items-center gap-2 text-base">
          <AlertCircle className="size-4" />
          Critical Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-col gap-1 rounded-md bg-white p-3 shadow-sm dark:bg-slate-900 border-l-4 border-rose-500">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{alert.message}</p>
            <p className="text-xs text-slate-500">{formatDateTime(alert.timestamp)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
