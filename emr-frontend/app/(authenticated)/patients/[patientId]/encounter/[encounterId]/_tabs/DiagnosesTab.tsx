import { DiagnosesTable } from '@/components/encounters/DiagnosesTable';

export default function DiagnosesTab({ encounterId }: { patientId: number; encounterId: number }) {
  return <DiagnosesTable encounterId={encounterId} />;
}
