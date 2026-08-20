import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface LabResultEmailProps {
  patientName: string;
  testName: string;
  verifiedBy: string;
  verifiedDate: string;
}

export const LabResultEmail = ({
  patientName,
  testName,
  verifiedBy,
  verifiedDate,
}: LabResultEmailProps) => {
  return (
    <EmailLayout
      previewText="Your lab result is ready"
      title="🔬 Lab Result Available"
    >
      <Text style={greeting}>Dear {patientName},</Text>
      
      <Text style={paragraph}>
        Your laboratory test result has been reviewed and verified by your physician.
      </Text>

      <Section style={resultCard}>
        <Text style={cardTitle}>Test Information</Text>
        <Text style={cardText}>Test: {testName}</Text>
        <Text style={cardText}>Verified by: {verifiedBy}</Text>
        <Text style={cardText}>Verified on: {verifiedDate}</Text>
      </Section>

      <Section style={securityNotice}>
        <Text style={securityTitle}>🔒 Privacy Notice</Text>
        <Text style={securityText}>
          For your privacy and security, we never send actual test results via email.
          Please log in to your secure patient portal to view your results.
        </Text>
      </Section>

      <Button href="http://localhost:3000/lab-results" style={button}>
        View Results in Portal
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

const resultCard = {
  backgroundColor: '#F0FDF4',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #BBF7D0',
};

const cardTitle = {
  color: '#16A34A',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const cardText = {
  color: '#1a1a1a',
  fontSize: '14px',
  marginBottom: '8px',
};

const securityNotice = {
  backgroundColor: '#FFFBEB',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
  border: '1px solid #FDE68A',
};

const securityTitle = {
  color: '#D97706',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const securityText = {
  color: '#92400E',
  fontSize: '13px',
  lineHeight: '20px',
};

const button = {
  backgroundColor: '#16A34A',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold',
  marginTop: '20px',
  display: 'inline-block',
};
