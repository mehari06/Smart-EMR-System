import { SOAPEditor } from '@/components/encounters/SOAPEditor';

export default function SoapTab({ encounterId }: { patientId: number; encounterId: number }) {
  return <SOAPEditor encounterId={encounterId} />;
}
