import {
  Button,
  Column,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface AppointmentReminderEmailProps {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  department: string;
  location: string;
}

export const AppointmentReminderEmail = ({
  patientName,
  appointmentDate,
  appointmentTime,
  doctorName,
  department,
  location,
}: AppointmentReminderEmailProps) => {
  return (
    <EmailLayout
      previewText={Appointment reminder for }
      title="📅 Appointment Reminder"
    >
      <Text style={greeting}>Dear {patientName},</Text>
      
      <Text style={paragraph}>
        This is a friendly reminder about your upcoming appointment. We look forward to seeing you!
      </Text>

      <Section style={appointmentCard}>
        <Text style={cardTitle}>Appointment Details</Text>
        
        <Row style={detailRow}>
          <Column style={labelColumn}>📅 Date:</Column>
          <Column style={valueColumn}>{appointmentDate}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={labelColumn}>⏰ Time:</Column>
          <Column style={valueColumn}>{appointmentTime}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={labelColumn}>👨‍⚕️ Doctor:</Column>
          <Column style={valueColumn}>{doctorName}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={labelColumn}>🏥 Department:</Column>
          <Column style={valueColumn}>{department}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={labelColumn}>📍 Location:</Column>
          <Column style={valueColumn}>{location}</Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        Please arrive 15 minutes before your scheduled time. If you need to reschedule, please contact us as soon as possible.
      </Text>

      <Button href="http://localhost:3000/appointments" style={button}>
        View My Appointments
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

const appointmentCard = {
  backgroundColor: '#F0F7FF',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
  border: '1px solid #BFDBFE',
};

const cardTitle = {
  color: '#1E90FF',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const detailRow = {
  marginBottom: '12px',
};

const labelColumn = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  width: '40%',
};

const valueColumn = {
  color: '#1a1a1a',
  fontSize: '14px',
  width: '60%',
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
