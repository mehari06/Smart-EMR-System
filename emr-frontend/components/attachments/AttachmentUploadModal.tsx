'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useUploadAttachment } from '@/hooks/useAttachments';
import { FILE_TYPE_LABELS, type AttachmentFileType } from '@/types/attachment';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const uploadSchema = z.object({
  file_type: z.enum(['lab_report', 'radiology_image', 'referral_letter', 'consent_form', 'other']),
  description: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface AttachmentUploadModalProps {
  patientId?: number;
  encounterId?: number;
  trigger?: React.ReactNode;
}

export function AttachmentUploadModal({ patientId, encounterId, trigger }: AttachmentUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      file_type: 'other',
      description: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onSubmit = (values: UploadFormValues) => {
    if (!selectedFile) return;

    uploadAttachment.mutate(
      {
        file: selectedFile,
        file_type: values.file_type,
        description: values.description,
        ...(patientId ? { patient: patientId } : {}),
        ...(encounterId ? { encounter: encounterId } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedFile(null);
          form.reset();
        },
      }
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Upload Attachment
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File <span className="text-red-500">*</span>
              </label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#1E90FF] hover:bg-blue-50 transition-colors text-center"
                >
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">
                    Click to select a file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, JPG, PNG, DOCX (Max 10MB)
                  </p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>

            {/* File Type */}
            <FormField
              control={form.control}
              name="file_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FILE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this file..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setSelectedFile(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || uploadAttachment.isPending}
                className="bg-[#1E90FF] hover:bg-[#1a7ae0] text-white"
              >
                {uploadAttachment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}