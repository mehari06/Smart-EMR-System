// 'use client';

// import { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { Building2, Users, Layers, Plus, Pencil, Trash2 } from 'lucide-react';
// import { coreApi } from '@/lib/api/core';
// import { useDeleteDepartment, useDeleteStaff, useDeleteOrganization } from '@/hooks/useSettings';
// import { StaffModal } from './_components/StaffModal';
// import { DepartmentModal } from './_components/DepartmentModal';
// import { OrganizationModal } from './_components/OrganizationModal';

// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
//   AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from '@/components/ui/alert-dialog';

// export default function SettingsPage() {
//   const [activeTab, setActiveTab] = useState<'org' | 'departments' | 'staff'>('staff');
//   const [staffModalOpen, setStaffModalOpen] = useState(false);
//   const [editStaff, setEditStaff] = useState<any>(null);
//   const [deleteStaffId, setDeleteStaffId] = useState<number | null>(null);
//   const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
//   const [editDepartment, setEditDepartment] = useState<any>(null);
//   const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
//   const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
//   const [editOrganization, setEditOrganization] = useState<any>(null);
//   const [deleteOrgId, setDeleteOrgId] = useState<number | null>(null);
//   const [staffSortColumn, setStaffSortColumn] = useState('staff_id');
//   const [staffSortOrder, setStaffSortOrder] = useState<'asc' | 'desc'>('asc');
//   const [deptSortColumn, setDeptSortColumn] = useState('name');
//   const [deptSortOrder, setDeptSortOrder] = useState<'asc' | 'desc'>('asc');

//   const handleStaffSort = (column: string) => {
//     if (staffSortColumn === column) {
//       setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
//     } else {
//       setStaffSortColumn(column);
//       setStaffSortOrder('asc');
//     }
//   };

//   const handleDeptSort = (column: string) => {
//     if (deptSortColumn === column) {
//       setDeptSortOrder(deptSortOrder === 'asc' ? 'desc' : 'asc');
//     } else {
//       setDeptSortColumn(column);
//       setDeptSortOrder('asc');
//     }
//   };

//   const { data: orgData, isLoading: loadingOrg } = useQuery({
//     queryKey: ['core', 'organizations'],
//     queryFn: () => coreApi.getOrganizations(),
//   });

//   const { data: deptData, isLoading: loadingDept } = useQuery({
//     queryKey: ['core', 'departments'],
//     queryFn: () => coreApi.getDepartments(),
//   });

//   const { data: staffData, isLoading: loadingStaff } = useQuery({
//     queryKey: ['core', 'staff'],
//     queryFn: () => coreApi.getStaff(),
//   });

//   const deleteStaff = useDeleteStaff();
//   const deleteDepartment = useDeleteDepartment();
//   const deleteOrganization = useDeleteOrganization();

//   const organizations = orgData?.results ?? [];
//   const departments = deptData?.results ?? [];
//   const staffMembers = staffData?.results ?? [];

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">System Settings</h1>
//         <p className="mt-1 text-sm text-slate-500">Manage organization details, departments, and staff accounts.</p>
//       </div>

//       <div className="flex border-b border-border">
//         <button
//           onClick={() => setActiveTab('staff')}
//           className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//             activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
//           }`}
//         >
//           <div className="flex items-center gap-2"><Users className="size-4" /> Staff Members</div>
//         </button>
//         <button
//           onClick={() => setActiveTab('departments')}
//           className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//             activeTab === 'departments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
//           }`}
//         >
//           <div className="flex items-center gap-2"><Layers className="size-4" /> Departments</div>
//         </button>
//         <button
//           onClick={() => setActiveTab('org')}
//           className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//             activeTab === 'org' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
//           }`}
//         >
//           <div className="flex items-center gap-2"><Building2 className="size-4" /> Organization</div>
//         </button>
//       </div>

//       {activeTab === 'staff' && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Staff Directory</CardTitle>
//               <CardDescription>Manage doctors, nurses, and administrative staff.</CardDescription>
//             </div>
//             <Button 
//               onClick={() => {
//                 setEditStaff(null);
//                 setStaffModalOpen(true);
//               }} 
//               className="gap-2"
//             >
//               <Plus className="size-4" /> Add Staff
//             </Button>
//           </CardHeader>
//           <CardContent>
//             {loadingStaff ? (
//               <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
//             ) : (
//               <div className="overflow-hidden rounded-lg border border-border bg-card">
//                 <Table>
//                   <TableHeader className="bg-slate-50 dark:bg-slate-900">
//                     <TableRow>
//                       <TableHead>
//                         <span className="cursor-pointer" onClick={() => handleStaffSort('user__first_name')}>
//                           Name {staffSortColumn === 'user__first_name' && (staffSortOrder === 'asc' ? '↑' : '↓')}
//                         </span>
//                       </TableHead>
//                       <TableHead>
//                         <span className="cursor-pointer" onClick={() => handleStaffSort('user__role')}>
//                           Role {staffSortColumn === 'user__role' && (staffSortOrder === 'asc' ? '↑' : '↓')}
//                         </span>
//                       </TableHead>
//                       <TableHead>
//                         <span className="cursor-pointer" onClick={() => handleStaffSort('staff_id')}>
//                           Staff ID {staffSortColumn === 'staff_id' && (staffSortOrder === 'asc' ? '↑' : '↓')}
//                         </span>
//                       </TableHead>
//                       <TableHead>Department</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {staffMembers.map((staff) => (
//                       <TableRow key={staff.id}>
//                         <TableCell>
//                           <p className="font-medium">{staff.user?.first_name} {staff.user?.last_name}</p>
//                           <p className="text-xs text-slate-500">{staff.user?.email}</p>
//                         </TableCell>
//                         <TableCell><Badge variant="outline" className="capitalize">{staff.user?.role?.replace('_', ' ')}</Badge></TableCell>
//                         <TableCell className="font-mono text-sm">{staff.staff_id}</TableCell>
//                         <TableCell className="text-slate-600">{departments.find((d) => d.id === staff.department)?.name ?? '—'}</TableCell>
//                         <TableCell>
//                           {staff.is_active ? (
//                             <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Active</Badge>
//                           ) : (
//                             <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50">Inactive</Badge>
//                           )}
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-1">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-[#1E90FF] hover:bg-blue-50"
//                               onClick={() => {
//                                 setEditStaff(staff);
//                                 setStaffModalOpen(true);
//                               }}
//                             >
//                               <Pencil className="size-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-red-500 hover:bg-red-50"
//                               onClick={() => setDeleteStaffId(staff.id)}
//                             >
//                               <Trash2 className="size-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {activeTab === 'departments' && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Departments</CardTitle>
//               <CardDescription>Clinical and administrative departments.</CardDescription>
//             </div>
//             <Button 
//               onClick={() => {
//                 setEditDepartment(null);
//                 setDepartmentModalOpen(true);
//               }} 
//               className="gap-2"
//             >
//               <Plus className="size-4" /> Add Department
//             </Button>
//           </CardHeader>
//           <CardContent>
//             {loadingDept ? (
//               <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
//             ) : (
//               <div className="overflow-hidden rounded-lg border border-border bg-card">
//                 <Table>
//                   <TableHeader className="bg-slate-50 dark:bg-slate-900">
//                     <TableRow>
//                       <TableHead>
//                         <span className="cursor-pointer" onClick={() => handleDeptSort('name')}>
//                           Name {deptSortColumn === 'name' && (deptSortOrder === 'asc' ? '↑' : '↓')}
//                         </span>
//                       </TableHead>
//                       <TableHead>Description</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {departments.map((dept) => (
//                       <TableRow key={dept.id}>
//                         <TableCell className="font-medium">{dept.name}</TableCell>
//                         <TableCell className="text-slate-600">{dept.description || '—'}</TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-1">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-[#1E90FF] hover:bg-blue-50"
//                               onClick={() => {
//                                 setEditDepartment(dept);
//                                 setDepartmentModalOpen(true);
//                               }}
//                             >
//                               <Pencil className="size-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-red-500 hover:bg-red-50"
//                               onClick={() => setDeleteDeptId(dept.id)}
//                             >
//                               <Trash2 className="size-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {activeTab === 'org' && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Organizations</CardTitle>
//               <CardDescription>Manage all clinic and hospital organizations.</CardDescription>
//             </div>
//             <Button 
//               onClick={() => {
//                 setEditOrganization(null);
//                 setOrganizationModalOpen(true);
//               }} 
//               className="gap-2"
//             >
//               <Plus className="size-4" /> Add Organization
//             </Button>
//           </CardHeader>
//           <CardContent>
//             {loadingOrg ? (
//               <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
//             ) : organizations.length === 0 ? (
//               <div className="text-center py-8">
//                 <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-2" />
//                 <p className="text-sm text-slate-400">No organizations yet</p>
//               </div>
//             ) : (
//               <div className="overflow-hidden rounded-lg border border-border bg-card">
//                 <Table>
//                   <TableHeader className="bg-slate-50 dark:bg-slate-900">
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Phone</TableHead>
//                       <TableHead>Address</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {organizations.map((org) => (
//                       <TableRow key={org.id}>
//                         <TableCell className="font-medium">{org.name}</TableCell>
//                         <TableCell className="text-slate-600">{org.email}</TableCell>
//                         <TableCell className="text-slate-600">{org.phone}</TableCell>
//                         <TableCell className="text-slate-600 truncate max-w-[200px]">{org.address}</TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-1">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-[#1E90FF] hover:bg-blue-50"
//                               onClick={() => {
//                                 setEditOrganization(org);
//                                 setOrganizationModalOpen(true);
//                               }}
//                             >
//                               <Pencil className="size-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="text-red-500 hover:bg-red-50"
//                               onClick={() => setDeleteOrgId(org.id)}
//                             >
//                               <Trash2 className="size-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       <StaffModal
//         open={staffModalOpen}
//         onOpenChange={setStaffModalOpen}
//         staff={editStaff}
//         departments={departments}
//       />

//       <DepartmentModal
//         open={departmentModalOpen}
//         onOpenChange={setDepartmentModalOpen}
//         department={editDepartment}
//         organizationId={organizations[0]?.id}
//       />

//       <OrganizationModal
//         open={organizationModalOpen}
//         onOpenChange={setOrganizationModalOpen}
//         organization={editOrganization}
//       />

//       <AlertDialog open={!!deleteStaffId} onOpenChange={(open) => !open && setDeleteStaffId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently remove this staff member. This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-500 hover:bg-red-600"
//               disabled={deleteStaff.isPending}
//               onClick={() => {
//                 if (deleteStaffId) {
//                   deleteStaff.mutate(deleteStaffId);
//                   setDeleteStaffId(null);
//                 }
//               }}
//             >
//               {deleteStaff.isPending ? 'Deleting...' : 'Delete'}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       <AlertDialog open={!!deleteDeptId} onOpenChange={(open) => !open && setDeleteDeptId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Department?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently remove this department. Staff assigned to it will be unassigned.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-500 hover:bg-red-600"
//               disabled={deleteDepartment.isPending}
//               onClick={() => {
//                 if (deleteDeptId) {
//                   deleteDepartment.mutate(deleteDeptId);
//                   setDeleteDeptId(null);
//                 }
//               }}
//             >
//               {deleteDepartment.isPending ? 'Deleting...' : 'Delete'}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       <AlertDialog open={!!deleteOrgId} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently remove this organization and all associated departments.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-500 hover:bg-red-600"
//               onClick={() => {
//                 if (deleteOrgId) {
//                   deleteOrganization.mutate(deleteOrgId);
//                   setDeleteOrgId(null);
//                 }
//               }}
//             >
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Layers, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { coreApi } from '@/lib/api/core';
import { useDeleteDepartment, useDeleteStaff, useDeleteOrganization } from '@/hooks/useSettings';
import { StaffModal } from './_components/StaffModal';
import { DepartmentModal } from './_components/DepartmentModal';
import { OrganizationModal } from './_components/OrganizationModal';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Administrator' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'staff_head', label: 'Staff Head' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_tech', label: 'Lab Technician' },
];

const ACTIVE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'departments' | 'staff'>('staff');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [deleteStaffId, setDeleteStaffId] = useState<number | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<any>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
  const [editOrganization, setEditOrganization] = useState<any>(null);
  const [deleteOrgId, setDeleteOrgId] = useState<number | null>(null);
  const [staffSortColumn, setStaffSortColumn] = useState('staff_id');
  const [staffSortOrder, setStaffSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deptSortColumn, setDeptSortColumn] = useState('name');
  const [deptSortOrder, setDeptSortOrder] = useState<'asc' | 'desc'>('asc');
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('');
  const [staffActiveFilter, setStaffActiveFilter] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  const handleStaffSort = (column: string) => {
    if (staffSortColumn === column) {
      setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStaffSortColumn(column);
      setStaffSortOrder('asc');
    }
  };

  const handleDeptSort = (column: string) => {
    if (deptSortColumn === column) {
      setDeptSortOrder(deptSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setDeptSortColumn(column);
      setDeptSortOrder('asc');
    }
  };

  const { data: orgData, isLoading: loadingOrg } = useQuery({
    queryKey: ['core', 'organizations'],
    queryFn: () => coreApi.getOrganizations(),
  });

  const { data: deptData, isLoading: loadingDept } = useQuery({
    queryKey: ['core', 'departments'],
    queryFn: () => coreApi.getDepartments(),
  });

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['core', 'staff'],
    queryFn: () => coreApi.getStaff(),
  });

  const deleteStaff = useDeleteStaff();
  const deleteDepartment = useDeleteDepartment();
  const deleteOrganization = useDeleteOrganization();

  const organizations = orgData?.results ?? [];
  const departments = deptData?.results ?? [];
  const allStaffMembers = staffData?.results ?? [];

  // Filter staff members
  const staffMembers = useMemo(() => {
    return allStaffMembers.filter((staff) => {
      // Role filter
      if (staffRoleFilter && staff.user?.role !== staffRoleFilter) return false;
      
      // Department filter
      if (staffDeptFilter && String(staff.department) !== staffDeptFilter) return false;
      
      // Active filter
      if (staffActiveFilter === 'true' && !staff.is_active) return false;
      if (staffActiveFilter === 'false' && staff.is_active) return false;
      
      // Search
      if (staffSearch) {
        const searchLower = staffSearch.toLowerCase();
        const fullName = `${staff.user?.first_name} ${staff.user?.last_name}`.toLowerCase();
        const email = staff.user?.email?.toLowerCase() ?? '';
        const staffId = staff.staff_id?.toLowerCase() ?? '';
        if (!fullName.includes(searchLower) && !email.includes(searchLower) && !staffId.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [allStaffMembers, staffRoleFilter, staffDeptFilter, staffActiveFilter, staffSearch]);

  // Sort staff members
  const sortedStaffMembers = useMemo(() => {
    return [...staffMembers].sort((a, b) => {
      const aVal = String(a[staffSortColumn] ?? a.user?.[staffSortColumn] ?? '');
      const bVal = String(b[staffSortColumn] ?? b.user?.[staffSortColumn] ?? '');
      return staffSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [staffMembers, staffSortColumn, staffSortOrder]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">System Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage organization details, departments, and staff accounts.</p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2"><Users className="size-4" /> Staff Members</div>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'departments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2"><Layers className="size-4" /> Departments</div>
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'org' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2"><Building2 className="size-4" /> Organization</div>
        </button>
      </div>

      {activeTab === 'staff' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>Manage doctors, nurses, and administrative staff.</CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditStaff(null);
                setStaffModalOpen(true);
              }} 
              className="gap-2"
            >
              <Plus className="size-4" /> Add Staff
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={staffRoleFilter} onValueChange={setStaffRoleFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="By Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={staffDeptFilter} onValueChange={setStaffDeptFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="By Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={staffActiveFilter} onValueChange={setStaffActiveFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="By Active" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingStaff ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead>
                        <span className="cursor-pointer" onClick={() => handleStaffSort('user__first_name')}>
                          Name {staffSortColumn === 'user__first_name' && (staffSortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </TableHead>
                      <TableHead>
                        <span className="cursor-pointer" onClick={() => handleStaffSort('user__role')}>
                          Role {staffSortColumn === 'user__role' && (staffSortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </TableHead>
                      <TableHead>
                        <span className="cursor-pointer" onClick={() => handleStaffSort('staff_id')}>
                          Staff ID {staffSortColumn === 'staff_id' && (staffSortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStaffMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          No staff found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedStaffMembers.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <p className="font-medium">{staff.user?.first_name} {staff.user?.last_name}</p>
                            <p className="text-xs text-slate-500">{staff.user?.email}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{staff.user?.role?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell className="font-mono text-sm">{staff.staff_id}</TableCell>
                          <TableCell className="text-slate-600">{departments.find((d) => d.id === staff.department)?.name ?? '—'}</TableCell>
                          <TableCell>
                            {staff.is_active ? (
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#1E90FF] hover:bg-blue-50"
                                onClick={() => {
                                  setEditStaff(staff);
                                  setStaffModalOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => setDeleteStaffId(staff.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'departments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Clinical and administrative departments.</CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditDepartment(null);
                setDepartmentModalOpen(true);
              }} 
              className="gap-2"
            >
              <Plus className="size-4" /> Add Department
            </Button>
          </CardHeader>
          <CardContent>
            {loadingDept ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead>
                        <span className="cursor-pointer" onClick={() => handleDeptSort('name')}>
                          Name {deptSortColumn === 'name' && (deptSortOrder === 'asc' ? '↑' : '↓')}
                        </span>
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="text-slate-600">{dept.description || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#1E90FF] hover:bg-blue-50"
                              onClick={() => {
                                setEditDepartment(dept);
                                setDepartmentModalOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteDeptId(dept.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'org' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Manage all clinic and hospital organizations.</CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditOrganization(null);
                setOrganizationModalOpen(true);
              }} 
              className="gap-2"
            >
              <Plus className="size-4" /> Add Organization
            </Button>
          </CardHeader>
          <CardContent>
            {loadingOrg ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No organizations yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-slate-600">{org.email}</TableCell>
                        <TableCell className="text-slate-600">{org.phone}</TableCell>
                        <TableCell className="text-slate-600 truncate max-w-[200px]">{org.address}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#1E90FF] hover:bg-blue-50"
                              onClick={() => {
                                setEditOrganization(org);
                                setOrganizationModalOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteOrgId(org.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <StaffModal
        open={staffModalOpen}
        onOpenChange={setStaffModalOpen}
        staff={editStaff}
        departments={departments}
      />

      <DepartmentModal
        open={departmentModalOpen}
        onOpenChange={setDepartmentModalOpen}
        department={editDepartment}
        organizationId={organizations[0]?.id}
      />

      <OrganizationModal
        open={organizationModalOpen}
        onOpenChange={setOrganizationModalOpen}
        organization={editOrganization}
      />

      <AlertDialog open={!!deleteStaffId} onOpenChange={(open) => !open && setDeleteStaffId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this staff member. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteStaff.isPending}
              onClick={() => {
                if (deleteStaffId) {
                  deleteStaff.mutate(deleteStaffId);
                  setDeleteStaffId(null);
                }
              }}
            >
              {deleteStaff.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDeptId} onOpenChange={(open) => !open && setDeleteDeptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this department. Staff assigned to it will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteDepartment.isPending}
              onClick={() => {
                if (deleteDeptId) {
                  deleteDepartment.mutate(deleteDeptId);
                  setDeleteDeptId(null);
                }
              }}
            >
              {deleteDepartment.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteOrgId} onOpenChange={(open) => !open && setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this organization and all associated departments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteOrgId) {
                  deleteOrganization.mutate(deleteOrgId);
                  setDeleteOrgId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}