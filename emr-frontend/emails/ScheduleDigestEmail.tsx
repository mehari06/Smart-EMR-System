import {
  Button,
  Column,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface ScheduleDigestEmailProps {
  doctorName: string;
  appointmentCount: number;
  firstAppointmentTime: string;
  lastAppointmentTime: string;
}

export const ScheduleDigestEmail = ({
  doctorName,
  appointmentCount,
  firstAppointmentTime,
  lastAppointmentTime,
}: ScheduleDigestEmailProps) => {
  return (
    <EmailLayout
      previewText={Your schedule:  appointments today}
      title="📋 Your Daily Schedule"
    >
      <Text style={greeting}>Good morning, Dr. {doctorName}!</Text>
      
      <Text style={paragraph}>
        Here's your schedule summary for today.
      </Text>

      <Section style={summaryCard}>
        <Row style={row}>
          <Column style={label}>Total Appointments:</Column>
          <Column style={value}>{appointmentCount}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>First Appointment:</Column>
          <Column style={value}>{firstAppointmentTime}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Last Appointment:</Column>
          <Column style={value}>{lastAppointmentTime}</Column>
        </Row>
      </Section>

      <Button href="http://localhost:3000/appointments" style={button}>
        View Full Schedule
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

const summaryCard = {
  backgroundColor: '#EFF6FF',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #BFDBFE',
};

const row = {
  marginBottom: '12px',
};

const label = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  width: '50%',
};

const value = {
  color: '#1E90FF',
  fontSize: '14px',
  fontWeight: 'bold',
  width: '50%',
};

const button = {
  backgroundColor: '#1E90FF',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 'bold',
  marginTop: '20px',
  display: 'inline-block',
};
