import { VitalsForm } from '@/components/encounters/VitalsForm';

export default function VitalsTab({ encounterId }: { patientId: number; encounterId: number }) {
  return <VitalsForm encounterId={encounterId} />;
}
