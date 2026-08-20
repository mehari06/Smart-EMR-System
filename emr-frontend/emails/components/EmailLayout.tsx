import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  title?: string;
}

export const EmailLayout = ({ children, previewText, title }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <table style={{ width: '100%' }}>
              <tr>
                <td style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={logoCircle}>
                    <span style={logoText}>SE</span>
                  </div>
                  <h1 style={headerTitle}>Smart EMR</h1>
                  <p style={headerSubtitle}>Electronic Medical Record System</p>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={content}>
            {title && <h2 style={titleStyle}>{title}</h2>}
            {children}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Smart EMR System. All rights reserved.
            </Text>
            <Text style={footerTextSmall}>
              This is an automated message. Please do not reply to this email.
              For your security, we never include protected health information in emails.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f0f4f8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
  padding: '20px',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
};

const header = {
  background: 'linear-gradient(135deg, #1E90FF 0%, #0066CC 100%)',
  padding: '0',
};

const logoCircle = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoText = {
  color: '#1E90FF',
  fontSize: '24px',
  fontWeight: 'bold',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '12px 0 4px',
};

const headerSubtitle = {
  color: '#E0F0FF',
  fontSize: '14px',
  margin: '0',
};

const content = {
  padding: '32px 24px',
};

const titleStyle = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footer = {
  padding: '20px 24px',
  backgroundColor: '#f9fafb',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0',
};

const footerTextSmall = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '4px 0',
};
