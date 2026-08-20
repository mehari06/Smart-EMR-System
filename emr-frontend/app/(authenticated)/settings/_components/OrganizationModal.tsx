'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2 } from 'lucide-react';
import { useCreateOrganization, useUpdateOrganization } from '@/hooks/useSettings';
import type { Organization } from '@/types/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(7, 'Valid phone required'),
  email: z.string().email('Valid email required'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization | null;
}

export function OrganizationModal({ open, onOpenChange, organization }: OrganizationModalProps) {
  const isEdit = !!organization;
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (organization) {
        form.reset({
          name: organization.name,
          address: organization.address,
          phone: organization.phone,
          email: organization.email,
        });
      } else {
        form.reset({
          name: '',
          address: '',
          phone: '',
          email: '',
        });
      }
    }
  }, [open, organization, form]);

  const onSubmit = (values: OrganizationFormValues) => {
    if (isEdit && organization) {
      updateOrganization.mutate(
        { id: organization.id, data: values },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createOrganization.mutate(values, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createOrganization.isPending || updateOrganization.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1E90FF]" />
            {isEdit ? 'Edit Organization' : 'Add Organization'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Smart Health Clinic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@clinic.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="+251 11 234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Street address, city, country..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Add Organization'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}