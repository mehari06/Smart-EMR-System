'use client';

import { useState } from 'react';
import { FileText, FlaskConical, Image, Pill, Download, Loader2 } from 'lucide-react';
import { useDownloadReport } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportDownloadButtonProps {
  patientId: number;
  patientNumber: string;
}

export function ReportDownloadButton({ patientId, patientNumber }: ReportDownloadButtonProps) {
  const { downloadPdf, downloadExcel } = useDownloadReport();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (type: string) => {
    setLoading(type);
    try {
      if (type === 'visits-pdf') {
        await downloadPdf('visits', patientId, patientNumber);
      } else if (type === 'lab-pdf') {
        await downloadPdf('lab', patientId, patientNumber);
      } else if (type === 'radiology-pdf') {
        await downloadPdf('radiology', patientId, patientNumber);
      } else if (type === 'prescriptions-pdf') {
        await downloadPdf('prescriptions', patientId, patientNumber);
      } else if (type === 'visits-excel') {
        await downloadExcel(patientId, patientNumber);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Reports
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Download Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleDownload('visits-pdf')}
          disabled={loading !== null}
        >
          {loading === 'visits-pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 text-blue-500" />
          )}
          Visit Report (PDF)
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleDownload('lab-pdf')}
          disabled={loading !== null}
        >
          {loading === 'lab-pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FlaskConical className="h-4 w-4 text-green-500" />
          )}
          Lab Report (PDF)
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleDownload('radiology-pdf')}
          disabled={loading !== null}
        >
          {loading === 'radiology-pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Image className="h-4 w-4 text-purple-500" />
          )}
          Radiology Report (PDF)
        </DropdownMenuItem>

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleDownload('prescriptions-pdf')}
          disabled={loading !== null}
        >
          {loading === 'prescriptions-pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pill className="h-4 w-4 text-amber-500" />
          )}
          Prescription Report (PDF)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => handleDownload('visits-excel')}
          disabled={loading !== null}
        >
          {loading === 'visits-excel' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 text-emerald-500" />
          )}
          Visit Report (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}