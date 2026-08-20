import { notFound, redirect } from 'next/navigation';
import SummaryTab from '../_tabs/SummaryTab';
import VitalsTab from '../_tabs/VitalsTab';
import DiagnosesTab from '../_tabs/DiagnosesTab';
import ConditionsTab from '../_tabs/ConditionsTab';
import TrendsTab from '../_tabs/TrendsTab';
import SoapTab from '../_tabs/SoapTab';
import { DischargeForm } from '@/components/encounters/DischargeForm';
import { LabOrdersTab } from '@/components/encounters/LabOrdersTab';
import { PrescriptionsTab } from '@/components/encounters/PrescriptionsTab';
import { RadiologyTab } from '@/components/encounters/RadiologyTab';

const VALID_TABS = new Set([
  'summary',
  'vitals',
  'diagnoses',
  'conditions',
  'trends',
  'soap',
  'prescriptions',
  'radiology',
  'lab',
  'discharge',
]);

export default async function EncounterTabPage({
  params,
}: {
  params: Promise<{ patientId: string; encounterId: string; tab?: string[] }>;
}) {
  const { patientId: patientIdParam, encounterId: encounterIdParam, tab: tabSegments } = await params;
  const patientId = Number.parseInt(patientIdParam, 10);
  const encounterId = Number.parseInt(encounterIdParam, 10);

  if (!Number.isFinite(patientId) || !Number.isFinite(encounterId)) {
    notFound();
  }

  if (!tabSegments || tabSegments.length === 0) {
    redirect(`/patients/${patientId}/encounter/${encounterId}/summary`);
  }

  if (tabSegments.length !== 1) {
    notFound();
  }

  const tab = tabSegments[0];

  if (!VALID_TABS.has(tab)) {
    notFound();
  }

  switch (tab) {
    case 'summary':
      return <SummaryTab patientId={patientId} encounterId={encounterId} />;
    case 'vitals':
      return <VitalsTab patientId={patientId} encounterId={encounterId} />;
    case 'diagnoses':
      return <DiagnosesTab patientId={patientId} encounterId={encounterId} />;
    case 'conditions':
      return <ConditionsTab patientId={patientId} encounterId={encounterId} />;
    case 'trends':
      return <TrendsTab patientId={patientId} encounterId={encounterId} />;
    case 'soap':
      return <SoapTab patientId={patientId} encounterId={encounterId} />;
    case 'prescriptions':
      return <PrescriptionsTab encounterId={encounterId} />;
    case 'radiology':
      return <RadiologyTab patientId={patientId} encounterId={encounterId} />;
    case 'lab':
      return <LabOrdersTab patientId={patientId} encounterId={encounterId} />;
    case 'discharge':
      return <DischargeForm encounterId={encounterId} />;
    default:
      notFound();
  }
}
