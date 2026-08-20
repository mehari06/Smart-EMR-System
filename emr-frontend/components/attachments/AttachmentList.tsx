'use client';

import { useState } from 'react';
import { useAttachments, useDeleteAttachment } from '@/hooks/useAttachments';
import { FILE_TYPE_LABELS, FILE_TYPE_COLORS, type FileAttachment } from '@/types/attachment';
import { AttachmentUploadModal } from './AttachmentUploadModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText, Download, Trash2, Paperclip, AlertCircle, FileImage,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function getFileIcon(fileType: string) {
  if (fileType === 'radiology_image') return FileImage;
  return FileText;
}

interface AttachmentListProps {
  patientId?: number;
  encounterId?: number;
  canUpload?: boolean;
  canDelete?: boolean;
}

export function AttachmentList({ patientId, encounterId, canUpload = true, canDelete = true }: AttachmentListProps) {
  const { data, isLoading, isError } = useAttachments({
    ...(patientId ? { patient: patientId } : {}),
    ...(encounterId ? { encounter: encounterId } : {}),
  });
  const deleteAttachment = useDeleteAttachment();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const attachments = data?.results ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" />
        Unable to load attachments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Attachments</h3>
          <p className="text-xs text-slate-500">
            {attachments.length} file(s)
          </p>
        </div>
        {canUpload && (
          <AttachmentUploadModal
            patientId={patientId}
            encounterId={encounterId}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Upload
              </Button>
            }
          />
        )}
      </div>

      {/* Empty state */}
      {attachments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <Paperclip className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No attachments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment: FileAttachment) => {
            const Icon = getFileIcon(attachment.file_type);
            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 flex-shrink-0">
                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {attachment.file.split('/').pop()}
                      </p>
                      <Badge className={FILE_TYPE_COLORS[attachment.file_type]}>
                        {FILE_TYPE_LABELS[attachment.file_type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {attachment.uploaded_by_name} • {new Date(attachment.uploaded_at).toLocaleDateString()}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 ml-3 flex-shrink-0">
                  <a
                    href={attachment.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button size="sm" variant="ghost" className="gap-1 text-[#1E90FF]">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </a>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => setDeleteId(attachment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteId) {
                  deleteAttachment.mutate(deleteId);
                  setDeleteId(null);
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