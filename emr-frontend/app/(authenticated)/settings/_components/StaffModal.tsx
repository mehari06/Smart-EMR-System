'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Loader2 } from 'lucide-react';
import { useCreateStaff, useUpdateStaff } from '@/hooks/useSettings';
import { ROLE_LABELS, type StaffMember } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const staffSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters').optional(),
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  role: z.string().min(1, 'Role required'),
  staff_id: z.string().min(1, 'Staff ID required'),
  department: z.number().nullable().optional(),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffMember | null;
  departments: Array<{ id: number; name: string }>;
}

export function StaffModal({ open, onOpenChange, staff, departments }: StaffModalProps) {
  const isEdit = !!staff;
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'doctor',
      staff_id: '',
      department: null,
      specialization: '',
      license_number: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (staff) {
        form.reset({
          email: staff.user.email,
          password: '',
          first_name: staff.user.first_name,
          last_name: staff.user.last_name,
          role: staff.user.role,
          staff_id: staff.staff_id,
          department: staff.department,
          specialization: staff.specialization,
          license_number: staff.license_number,
        });
      } else {
        form.reset({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'doctor',
          staff_id: '',
          department: null,
          specialization: '',
          license_number: '',
        });
      }
    }
  }, [open, staff, form]);

  const onSubmit = (values: StaffFormValues) => {
    if (isEdit && staff) {
      const updateData: any = { ...values };
      if (!updateData.password) delete updateData.password;
      updateStaff.mutate(
        { id: staff.id, data: updateData },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createStaff.mutate(values as any, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createStaff.isPending || updateStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#1E90FF]" />
            {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS)
                          .filter(([value]) => value !== 'patient')
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="staff_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff ID *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    defaultValue={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}