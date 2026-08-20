import {
  Button,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
  expiryMinutes: number;
}

export const PasswordResetEmail = ({
  userName,
  resetLink,
  expiryMinutes,
}: PasswordResetEmailProps) => {
  return (
    <EmailLayout
      previewText="Reset your password"
      title="🔐 Password Reset"
    >
      <Text style={greeting}>Hello {userName},</Text>
      
      <Text style={paragraph}>
        We received a request to reset your password. Click the button below to create a new password.
      </Text>

      <Button href={resetLink} style={button}>
        Reset Password
      </Button>

      <Section style={warningCard}>
        <Text style={warningTitle}>⚠️ Security Notice</Text>
        <Text style={warningText}>
          This link expires in {expiryMinutes} minutes.
          If you didn't request this, you can safely ignore this email.
          Your password will not be changed.
        </Text>
      </Section>
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

const button = {
  backgroundColor: '#DC2626',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold',
  marginTop: '20px',
  display: 'inline-block',
};

const warningCard = {
  backgroundColor: '#FEF2F2',
  borderRadius: '12px',
  padding: '16px',
  margin: '20px 0',
  border: '1px solid #FECACA',
};

const warningTitle = {
  color: '#DC2626',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

const warningText = {
  color: '#991B1B',
  fontSize: '13px',
  lineHeight: '20px',
};
