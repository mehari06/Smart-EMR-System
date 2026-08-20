import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface MedicationReminderEmailProps {
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
}

export const MedicationReminderEmail = ({
  patientName,
  medicationName,
  dosage,
  frequency,
}: MedicationReminderEmailProps) => {
  return (
    <EmailLayout
      previewText="Time to take your medication"
      title="💊 Medication Reminder"
    >
      <Text style={greeting}>Dear {patientName},</Text>
      
      <Text style={paragraph}>
        It's time to take your medication. Please take it as prescribed by your physician.
      </Text>

      <Section style={medicationCard}>
        <Text style={medicationNameStyle}>💊 {medicationName}</Text>
        <Text style={medicationDetail}>Dosage: {dosage}</Text>
        <Text style={medicationDetail}>Frequency: {frequency}</Text>
      </Section>

      <Button href="http://localhost:3000/medications" style={button}>
        View My Medications
      </Button>
    </EmailLayout>
  );
};

const greeting = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
};

const medicationCard = {
  backgroundColor: '#F5F3FF',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #DDD6FE',
};

const medicationNameStyle = {
  color: '#7C3AED',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const medicationDetail = {
  color: '#4b5563',
  fontSize: '14px',
  marginBottom: '8px',
};

const button = {
  backgroundColor: '#7C3AED',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold',
  marginTop: '20px',
  display: 'inline-block',
};
