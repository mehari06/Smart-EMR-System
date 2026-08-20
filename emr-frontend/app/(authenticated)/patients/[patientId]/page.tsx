'use client';

import { useState } from 'react'; 
import { ReportDownloadButton } from '@/components/reports/ReportDownloadButton';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api/patients';
import { clinicalApi } from '@/lib/api/clinical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, FileText, FlaskConical, Paperclip, Plus } from 'lucide-react'; // ← ADD Plus
import Link from 'next/link';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { MedicalHistoryForm } from '@/components/encounters/MedicalHistoryForm';

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = Number(params.patientId);
  const [historyFormOpen, setHistoryFormOpen] = useState(false); // ← ADD THIS

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
    enabled: !!patientId,
  });

  const { data: encounters } = useQuery({
    queryKey: ['encounters', 'patient', patientId],
    queryFn: () => clinicalApi.listEncounters({ patient: patientId }),
    enabled: !!patientId,
  });

  const { data: history } = useQuery({
    queryKey: ['medicalHistory', patientId],
    queryFn: () => clinicalApi.getMedicalHistory(patientId),
    enabled: !!patientId,
  });

  if (loadingPatient) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-slate-500">Patient not found.</p>
        <Link href="/appointments">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
          </Button>
        </Link>
      </div>
    );
  }

  const encounterList = encounters?.results ?? [];
  const historyList = history?.results ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Back button */}
      <Link href="/appointments">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Appointments
        </Button>
      </Link>
      {/* Patient Header */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">
            {patient.user?.first_name?.[0]}{patient.user?.last_name?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.user?.full_name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono">{patient.patient_number}</Badge>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {patient.date_of_birth} ({patient.gender_display})
              </span>
              {patient.blood_group && (
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Blood: {patient.blood_group_display}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> {patient.phone}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" /> {patient.address}
            </div>
          </div>
          {/* ADD THIS - Report Download Button */}
          <div className="flex-shrink-0">
            <ReportDownloadButton 
              patientId={patientId} 
              patientNumber={patient.patient_number} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-red-500" /> Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.allergies?.length > 0 ? (
              <div className="space-y-2">
                {patient.allergies.map((allergy: any) => (
                  <div key={allergy.id} className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <p className="font-semibold text-red-800">{allergy.allergy_name}</p>
                    <p className="text-sm text-red-600">
                      Severity: {allergy.severity_display}
                      {allergy.reaction && ` • Reaction: ${allergy.reaction}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No Known Allergies (NKA)</p>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Medical History
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setHistoryFormOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardHeader>

          <CardContent>
            {historyList.length > 0 ? (
              <div className="space-y-2">
                {historyList.map((item: any) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="font-semibold">{item.condition_name}</p>
                    <p className="text-sm text-slate-500">
                      {item.condition_type_display} • {item.status_display}
                      {item.icd10_code && ` • ICD-10: ${item.icd10_code}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No medical history recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-[#1E90FF]" /> Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentList patientId={patientId} />
        </CardContent>
      </Card>

      {/* Past Encounters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Past Encounters</CardTitle>
        </CardHeader>
        <CardContent>
          {encounterList.length > 0 ? (
            <div className="space-y-3">
              {encounterList.map((enc: any) => (
                <div key={enc.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {enc.chief_complaint || 'Encounter'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(enc.started_at).toLocaleDateString()} • Dr. {enc.doctor?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={enc.status === 'O' ? 'default' : 'secondary'}>
                      {enc.status_display}
                    </Badge>
                    <Link href={`/patients/${patientId}/encounter/${enc.id}/summary`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No encounters found.</p>
          )}
        </CardContent>
      </Card>

      {/* Medical History Form Modal - ADD THIS AT THE BOTTOM */}
      <MedicalHistoryForm
        patientId={patientId}
        open={historyFormOpen}
        onOpenChange={setHistoryFormOpen}
      />
    </div>
  );
}