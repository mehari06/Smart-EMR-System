'use client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users, UserCheck, UserX, CalendarPlus, PlusCircle,
  Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2,
  MoreHorizontal, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

import { patientsApi, type PatientListItem, type PatientDetail, type CreatePatientData, type UpdatePatientData } from '@/lib/api/patients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/DashboardShared';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── CREATE Schema (requires everything) ─────────────────────────────
const createPatientSchema = z.object({
  first_name:               z.string().min(1, 'First name is required'),
  last_name:                z.string().min(1, 'Last name is required'),
  email:                    z.string().email('Valid email required'),
  password:                 z.string().min(8, 'Min 8 characters'),
  date_of_birth:            z.string().min(1, 'Date of birth required'),
  gender:                   z.enum(['M', 'F'], { required_error: 'Gender required' }),
  blood_group:              z.string().optional(),
  phone:                    z.string().min(7, 'Phone required'),
  address:                  z.string().min(1, 'Address required'),
  emergency_contact_name:   z.string().min(1, 'Emergency contact required'),
  emergency_contact_phone:  z.string().min(7, 'Emergency contact phone required'),
});
type CreatePatientFormValues = z.infer<typeof createPatientSchema>;

// ── EDIT Schema (all fields optional) ───────────────────────────────
const editPatientSchema = z.object({
  first_name:               z.string().min(1, 'First name is required').optional(),
  last_name:                z.string().min(1, 'Last name is required').optional(),
  date_of_birth:            z.string().optional(),
  gender:                   z.enum(['M', 'F']).optional(),
  blood_group:              z.string().optional(),
  phone:                    z.string().min(7, 'Phone must be at least 7 digits').optional(),
  address:                  z.string().optional(),
  emergency_contact_name:   z.string().optional(),
  emergency_contact_phone:  z.string().optional(),
});
type EditPatientFormValues = z.infer<typeof editPatientSchema>;

// ── Initials helper ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Add/Edit Patient Modal Form ──────────────────────────────────────
function PatientModal({
  open, onOpenChange, mode, patient, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'create' | 'edit';
  patient?: PatientDetail;
  onSave: (data: any) => Promise<void>;
}) {
  const isEdit = mode === 'edit';
  const schema = isEdit ? editPatientSchema : createPatientSchema;
  
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });
  
  const gender = watch('gender');
  const bloodGroup = watch('blood_group');

  useEffect(() => {
    if (open) {
      if (isEdit && patient) {
        reset({
          first_name: patient.user?.first_name || '',
          last_name: patient.user?.last_name || '',
          date_of_birth: patient.date_of_birth || '',
          gender: patient.gender as 'M' | 'F' | undefined,
          blood_group: patient.blood_group || '',
          phone: patient.phone || '',
          address: patient.address || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
        });
      } else {
        reset({
          first_name: '', last_name: '', email: '', password: '', date_of_birth: '',
          gender: undefined, blood_group: '', phone: '', address: '',
          emergency_contact_name: '', emergency_contact_phone: ''
        });
      }
    }
  }, [open, isEdit, patient, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {isEdit ? 'Edit Patient' : 'Register New Patient'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update patient demographics and contact details.'
              : 'Enter demographics and emergency contact details for the patient record.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <Input {...register('first_name')} placeholder="Abebe" />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{String(errors.first_name.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <Input {...register('last_name')} placeholder="Kebede" />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{String(errors.last_name.message)}</p>}
            </div>
          </div>

          {!isEdit && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input {...register('email')} type="email" placeholder="abebe@example.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{String(errors.email.message)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <Input {...register('password')} type="password" placeholder="Min 8 chars" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{String(errors.password.message)}</p>}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <Input {...register('date_of_birth')} type="date" />
              {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{String(errors.date_of_birth.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <Select value={gender} onValueChange={(v) => setValue('gender', v as 'M' | 'F', { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{String(errors.gender.message)}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input {...register('phone')} placeholder="+251 91 234 5678" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{String(errors.phone.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <Select value={bloodGroup} onValueChange={(v) => setValue('blood_group', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <Input {...register('address')} placeholder="Addis Ababa, Ethiopia" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{String(errors.address.message)}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
              <Input {...register('emergency_contact_name')} placeholder="Name" />
              {errors.emergency_contact_name && <p className="text-xs text-red-500 mt-1">{String(errors.emergency_contact_name.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone</label>
              <Input {...register('emergency_contact_phone')} placeholder="+251 91 ..." />
              {errors.emergency_contact_phone && <p className="text-xs text-red-500 mt-1">{String(errors.emergency_contact_phone.message)}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Patient' : 'Save Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function PatientsPage() {
  const user = useAuthStore((state) => state.user);
  const canAddEdit = user?.role === 'admin' || user?.role === 'staff_head';

  const qc = useQueryClient();
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [modalState, setModalState] = useState<{ open: boolean; mode: 'create' | 'edit'; patient?: PatientDetail }>({
    open: false,
    mode: 'create',
  });
  const [patientToDeactivate, setPatientToDeactivate] = useState<PatientListItem | null>(null);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patients', page, globalFilter, sortColumn, sortOrder],
    queryFn: () => patientsApi.list({ 
      page, 
      search: globalFilter, 
      page_size: 10,
      ordering: `${sortOrder === 'desc' ? '-' : ''}${sortColumn}`,
    }),
  });

  const patients = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.ceil(totalCount / 10);

  const maleCount = patients.filter((p: PatientListItem) => p.gender === 'M').length;
  const femaleCount = patients.filter((p: PatientListItem) => p.gender === 'F').length;
  const activeCount = patients.filter((p: PatientListItem) => p.is_active).length;

  const createMutation = useMutation({
    mutationFn: (data: CreatePatientData) => patientsApi.create(data),
    onSuccess: () => {
      toast.success('Patient registered successfully!');
      qc.invalidateQueries({ queryKey: ['patients'] });
      setModalState({ open: false, mode: 'create' });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Failed to register patient';
      toast.error(detail);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<UpdatePatientData> }) => patientsApi.update(id, data),
    onSuccess: () => {
      toast.success('Patient updated successfully!');
      qc.invalidateQueries({ queryKey: ['patients'] });
      setModalState({ open: false, mode: 'create' });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.email?.[0] || err?.response?.data?.detail || 'Failed to update patient';
      toast.error(detail);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => patientsApi.deactivate(id),
    onSuccess: () => {
      toast.success('Patient deactivated.');
      qc.invalidateQueries({ queryKey: ['patients'] });
      setPatientToDeactivate(null);
    },
    onError: () => toast.error('Failed to deactivate patient'),
  });

  const columns = useMemo<ColumnDef<PatientListItem>[]>(() => [
    {
      accessorKey: 'patient_number',
      header: () => (
        <span className="cursor-pointer uppercase" onClick={() => handleSort('patient_number')}>
          Patient ID
          {sortColumn === 'patient_number' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </span>
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold text-primary">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'full_name',
      header: () => (
        <span className="cursor-pointer uppercase" onClick={() => handleSort('user__first_name')}>
          Name
          {sortColumn === 'user__first_name' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials(row.original.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-slate-800 text-sm">{row.original.full_name}</p>
            <p className="text-xs text-slate-400">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'gender_display',
      header: () => (
        <span className="cursor-pointer uppercase" onClick={() => handleSort('gender')}>
          Gender
          {sortColumn === 'gender' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </span>
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={row.original.gender === 'M'
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-pink-200 bg-pink-50 text-pink-700'}
        >
          {row.original.gender_display}
        </Badge>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => <span className="text-sm text-slate-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'registered_at',
      header: () => (
        <span className="cursor-pointer uppercase" onClick={() => handleSort('registered_at')}>
          Registered
          {sortColumn === 'registered_at' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </span>
      ),
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500">
          {new Date(getValue() as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: () => (
        <span className="cursor-pointer uppercase" onClick={() => handleSort('is_active')}>
          Status
          {sortColumn === 'is_active' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </span>
      ),
      cell: ({ getValue }) => (
        <Badge className={getValue() ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
          {getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" id={`patient-actions-${patient.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>
                <Eye className="h-4 w-4" /> View Details
              </DropdownMenuItem>
              {canAddEdit && (
                <>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={async () => {
                    try {
                      const detail = await patientsApi.get(patient.id);
                      setModalState({ open: true, mode: 'edit', patient: detail });
                    } catch {
                      toast.error('Unable to load patient details for editing');
                    }
                  }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => setPatientToDeactivate(patient)}
                  >
                    <Trash2 className="h-4 w-4" /> Deactivate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [canAddEdit, router, sortColumn, sortOrder]);

  const table = useReactTable({
    data: patients,
    columns,
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-1">{totalCount} patients registered</p>
        </div>
        {canAddEdit && (
          <Button
            id="add-patient-btn"
            onClick={() => setModalState({ open: true, mode: 'create' })}
            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={totalCount} tone="teal" trend={{ value: 5, isPositive: true }} chartData={[{value: 10}, {value: 12}, {value: 15}, {value: 14}, {value: 18}, {value: 20}]} />
        <StatCard icon={UserCheck} label="Male Patients" value={maleCount} tone="blue" chartData={[{value: 5}, {value: 8}, {value: 6}, {value: 10}, {value: 12}, {value: 15}]} />
        <StatCard icon={Users} label="Female Patients" value={femaleCount} tone="rose" chartData={[{value: 8}, {value: 6}, {value: 10}, {value: 12}, {value: 14}, {value: 18}]} />
        <StatCard icon={CalendarPlus} label="Active" value={activeCount} tone="green" trend={{ value: 12, isPositive: true }} chartData={[{value: 2}, {value: 4}, {value: 3}, {value: 6}, {value: 5}, {value: 8}]} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="patient-search"
                placeholder="Search by name, ID, phone..."
                value={globalFilter}
                onChange={(e) => { setGlobalFilter(e.target.value); setPage(1); }}
                className="pl-9 w-full"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(v)}
                    className="capitalize"
                  >
                    {column.id.replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-slate-400 text-sm">
                      Loading patients...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-red-500 text-sm font-medium">
                      Error loading patients: {error?.message || 'Unknown error occurred'}
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-slate-400 text-sm">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-slate-500">
              Page {page} of {pageCount || 1} — {totalCount} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="icon-sm" id="prev-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="icon-sm" id="next-page-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PatientModal
        open={modalState.open}
        onOpenChange={(open) => {
          if (!open) setModalState({ open: false, mode: 'create' });
        }}
        mode={modalState.mode}
        patient={modalState.patient}
        onSave={async (data) => {
          if (modalState.mode === 'edit' && modalState.patient) {
            await updateMutation.mutateAsync({ id: modalState.patient.id, data });
          } else {
            await createMutation.mutateAsync(data);
          }
        }}
      />

      <ConfirmDialog
        open={!!patientToDeactivate}
        onOpenChange={(open) => { if (!open) setPatientToDeactivate(null); }}
        title="Deactivate Patient?"
        description={
          <div>
            This will deactivate <strong>{patientToDeactivate?.full_name}</strong>'s account. 
            They will no longer be able to access the patient portal. 
            This action can be reversed by an administrator.
          </div>
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => {
          if (patientToDeactivate) {
            deactivateMutation.mutate(patientToDeactivate.id);
          }
        }}
      />
    </div>
  );
}