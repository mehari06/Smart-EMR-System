import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function useDownloadReport() {
  const downloadPdf = (reportType: 'visits' | 'lab' | 'radiology' | 'prescriptions', patientId: number, patientNumber: string) => {
    const apiMap = {
      visits: {
        fn: reportsApi.getPatientVisitsPdf,
        filename: `patient_visit_report_${patientNumber}.pdf`,
      },
      lab: {
        fn: reportsApi.getLabReportPdf,
        filename: `lab_report_${patientNumber}.pdf`,
      },
      radiology: {
        fn: reportsApi.getRadiologyReportPdf,
        filename: `radiology_report_${patientNumber}.pdf`,
      },
      prescriptions: {
        fn: reportsApi.getPrescriptionReportPdf,
        filename: `prescription_report_${patientNumber}.pdf`,
      },
    };

    const { fn, filename } = apiMap[reportType];
    
    return fn(patientId)
      .then((blob: Blob) => {
        downloadBlob(blob, filename);
        toast.success('Report downloaded');
      })
      .catch(() => {
        toast.error('Failed to download report');
      });
  };

  const downloadExcel = (patientId: number, patientNumber: string) => {
    return reportsApi.getPatientVisitsExcel(patientId)
      .then((blob: Blob) => {
        downloadBlob(blob, `patient_visit_report_${patientNumber}.xlsx`);
        toast.success('Excel report downloaded');
      })
      .catch(() => {
        toast.error('Failed to download Excel report');
      });
  };

  return { downloadPdf, downloadExcel };
}