'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, UserX } from 'lucide-react';

interface DeactivatePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  isDeactivating?: boolean;
  onConfirm: () => void;
}

export function DeactivatePatientDialog({
  open,
  onOpenChange,
  patientName,
  isDeactivating = false,
  onConfirm,
}: DeactivatePatientDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
              <UserX className="size-5 text-red-600" />
            </div>
            <AlertDialogTitle>Deactivate Patient?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You are about to deactivate <strong>{patientName}</strong>. This will:
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
              <li>Revoke their access to the patient portal</li>
              <li>Hide them from active patient lists</li>
              <li>Keep their medical records intact</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              This action can be reversed by an administrator.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeactivating}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeactivating ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Deactivating...
              </>
            ) : (
              'Deactivate Patient'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}