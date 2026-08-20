'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              isDanger && 'bg-red-50 text-red-600',
              isSuccess && 'bg-emerald-50 text-emerald-600'
            )}
          >
            <Icon className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              isDanger && 'bg-red-600 text-white hover:bg-red-700',
              isSuccess && 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}