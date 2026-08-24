'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import type { AuditLog } from '@/lib/api/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, FileClock, Calendar } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  LOGIN: 'bg-purple-100 text-purple-700 border-purple-200',
  LOGOUT: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPORT: 'bg-amber-100 text-amber-700 border-amber-200',
  UPLOAD: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  DOWNLOAD: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  PRESCRIBE: 'bg-pink-100 text-pink-700 border-pink-200',
  ORDER_LAB: 'bg-orange-100 text-orange-700 border-orange-200',
  START: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REOPEN: 'bg-teal-100 text-teal-700 border-teal-200',
  RECORD_VITALS: 'bg-lime-100 text-lime-700 border-lime-200',
  ADD_DIAGNOSIS: 'bg-green-100 text-green-700 border-green-200',
  CLOSE: 'bg-gray-100 text-gray-700 border-gray-200',
  DISPENSE: 'bg-rose-100 text-rose-700 border-rose-200',
  RECEIVE_LAB_RESULT: 'bg-sky-100 text-sky-700 border-sky-200',
  VERIFY_LAB_RESULT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ORDER_RADIOLOGY: 'bg-violet-100 text-violet-700 border-violet-200',
  RECEIVE_RADIOLOGY_RESULT: 'bg-purple-100 text-purple-700 border-purple-200',
  VERIFY_RADIOLOGY_RESULT: 'bg-green-100 text-green-700 border-green-200',
  TRIAGE: 'bg-amber-100 text-amber-700 border-amber-200',
  CHECKIN: 'bg-blue-100 text-blue-700 border-blue-200',
  ASSIGN_DOCTOR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};
const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'UPLOAD', label: 'Upload' },
  { value: 'DOWNLOAD', label: 'Download' },
  { value: 'CLOSE', label: 'Close' },
  { value: 'START', label: 'Start' },
  { value: 'REOPEN', label: 'Reopen Encounter' },
  { value: 'RECORD_VITALS', label: 'Record Vitals' },
  { value: 'ADD_DIAGNOSIS', label: 'Add Diagnosis' },
  { value: 'PRESCRIBE', label: 'Prescribe' },
  { value: 'DISPENSE', label: 'Dispense Medication' },
  { value: 'ORDER_LAB', label: 'Order Lab' },
  { value: 'RECEIVE_LAB_RESULT', label: 'Receive Lab Result' },
  { value: 'VERIFY_LAB_RESULT', label: 'Verify Lab Result' },
  { value: 'ORDER_RADIOLOGY', label: 'Order Radiology' },
  { value: 'RECEIVE_RADIOLOGY_RESULT', label: 'Receive Radiology Result' },
  { value: 'VERIFY_RADIOLOGY_RESULT', label: 'Verify Radiology Result' },
  { value: 'TRIAGE', label: 'Triage Patient' },
  { value: 'CHECKIN', label: 'Check In Patient' },
  { value: 'ASSIGN_DOCTOR', label: 'Assign Doctor' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
];

const MODEL_OPTIONS = [
  { value: '', label: 'All Models' },
  { value: 'Patient', label: 'Patient' },
  { value: 'Appointment', label: 'Appointment' },
  { value: 'Encounter', label: 'Encounter' },
  { value: 'VitalSign', label: 'Vital Signs' },
  { value: 'Diagnosis', label: 'Diagnosis' },
  { value: 'LabOrder', label: 'Lab Order' },
  { value: 'FileAttachment', label: 'File Attachment' },
  { value: 'Prescription', label: 'Prescription' },
];

const DATE_OPTIONS = [
  { value: '', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Past 7 Days' },
  { value: '30days', label: 'This Month' },
  { value: '365days', label: 'This Year' },
];

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  const getDateParam = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return now.toISOString().slice(0, 10);
      case '7days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
      }
      case '30days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      }
      case '365days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 365);
        return d.toISOString().slice(0, 10);
      }
      default:
        return '';
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter, modelFilter, dateFilter],
    queryFn: () => dashboardApi.auditLogs({
      page,
      page_size: 20,
      ...(search ? { search } : {}),
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(modelFilter ? { model_name: modelFilter } : {}),
      ...(dateFilter ? { timestamp_after: getDateParam() } : {}),
    }),
  });

  const logs = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track all system activity and access events
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>{totalCount} total events</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row 1 */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search audit logs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="By Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters Row 2 */}
          <div className="flex gap-3 mb-4">
            <Select value={modelFilter} onValueChange={(v) => { setModelFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="By Model" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="By Timestamp" />
              </SelectTrigger>
              <SelectContent>
                {DATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter('')}
                className="text-slate-400"
              >
                Clear Date
              </Button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500">Unable to load audit logs.</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileClock className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs uppercase font-semibold">User</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Action</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Model</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Object</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLog) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell>
                        <p className="font-medium text-slate-900 text-sm">
                          {log.user_full_name || log.user_email || 'System'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {log.model_name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[250px] truncate" title={log.object_repr}>
                        {log.object_repr || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Page {page} of {pageCount || 1} — {totalCount} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}