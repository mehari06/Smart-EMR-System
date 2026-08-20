"""
Tests for Notification Services.
"""

import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model

from notifications.models import Notification
from notifications.services import (
    send_notification,
    notify_appointment_reminder,
    notify_lab_result_ready,
    notify_medication_reminder,
    notify_password_reset,
    notify_schedule_digest,
    notify_account_invitation,
)

User = get_user_model()


@pytest.mark.django_db
class TestNotificationCreation:
    """Test creating notifications."""
    
    def test_send_notification_creates_in_app(self, admin_user):
        """Send notification creates in-app record."""
        send_notification(
            user=admin_user,
            notification_type='general',
            title='Test Title',
            message='Test Message',
            priority='normal',
        )
        
        notification = Notification.objects.first()
        assert notification is not None
        assert notification.recipient == admin_user
        assert notification.title == 'Test Title'
        assert notification.message == 'Test Message'
        assert notification.is_read is False
    
    def test_send_notification_with_email(self, admin_user):
        """Send notification with email (mocked)."""
        with patch('notifications.email_service.ResendEmailService.send') as mock_send:
            send_notification(
                user=admin_user,
                notification_type='general',
                title='Test',
                message='Test Message',
                email_subject='Test Email',
                email_html='<h1>Test</h1>',
            )
            
            mock_send.assert_called_once()
    
    def test_notification_default_priority(self, admin_user):
        """Default priority is normal."""
        send_notification(
            user=admin_user,
            notification_type='general',
            title='Test',
            message='Message',
        )
        
        notification = Notification.objects.first()
        assert notification.priority == 'normal'


@pytest.mark.django_db
class TestSpecificNotifications:
    """Test specific notification types."""
    
    def test_notify_appointment_reminder(self, patient_user, appointment):
        """Appointment reminder notification."""
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_appointment_reminder(patient_user, appointment)
        
        notification = Notification.objects.filter(
            type='appointment_reminder'
        ).first()
        
        assert notification is not None
        assert notification.recipient == patient_user
    
    def test_notify_lab_result_ready(self, patient_user, lab_test, encounter, doctor_staff):
        """Lab result notification."""
        from laboratory.models import LabOrder
        
        lab_order = LabOrder.objects.create(
            encounter=encounter,
            patient=encounter.patient,
            ordered_by=doctor_staff,
            test=lab_test,
            status='R',
            is_verified=True,
        )
        
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_lab_result_ready(patient_user, lab_order)
        
        notification = Notification.objects.filter(
            type='lab_result'
        ).first()
        
        assert notification is not None
        assert notification.recipient == patient_user
    
    def test_notify_medication_reminder(self, patient_user, medicine, doctor_staff):
        """Medication reminder notification."""
        from prescriptions.models import PrescriptionItem, Prescription
        from clinical.models import Encounter
        
        encounter = Encounter.objects.create(
            patient=patient_user.patient_profile,
            chief_complaint='Test',
        )
        
        prescription = Prescription.objects.create(
            encounter=encounter,
            prescribed_by=doctor_staff,
            status='A',
        )
        
        item = PrescriptionItem.objects.create(
            prescription=prescription,
            medicine=medicine,
            dosage='500mg',
            frequency='Twice daily',
            duration='7 days',
            quantity=14,
        )
        
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_medication_reminder(patient_user, item)
        
        notification = Notification.objects.filter(
            type='drug_reminder'
        ).first()
        
        assert notification is not None
    
    def test_notify_password_reset(self, admin_user):
        """Password reset notification."""
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_password_reset(admin_user, 'test-token-123')
        
        notification = Notification.objects.filter(
            type='password_reset'
        ).first()
        
        assert notification is not None
        assert notification.recipient == admin_user
    
    def test_notify_schedule_digest(self, doctor_user, appointment):
        """Schedule digest notification."""
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_schedule_digest(doctor_user, [appointment])
        
        notification = Notification.objects.filter(
            type='schedule_digest'
        ).first()
        
        assert notification is not None
    
    def test_notify_account_invitation(self, doctor_user):
        """Account invitation notification."""
        with patch('notifications.email_service.ResendEmailService.send'):
            notify_account_invitation(doctor_user, doctor_user.email)
        
        notification = Notification.objects.filter(
            type='account_invitation'
        ).first()
        
        assert notification is not None


@pytest.mark.django_db
class TestNotificationQueries:
    """Test notification queries."""
    
    def test_unread_count(self, admin_user):
        """Count unread notifications."""
        send_notification(
            user=admin_user,
            notification_type='general',
            title='Test 1',
            message='Message 1',
        )
        send_notification(
            user=admin_user,
            notification_type='general',
            title='Test 2',
            message='Message 2',
        )
        
        unread = Notification.objects.filter(
            recipient=admin_user, 
            is_read=False
        ).count()
        assert unread == 2
    
    def test_mark_as_read(self, admin_user):
        """Mark notification as read."""
        send_notification(
            user=admin_user,
            notification_type='general',
            title='Test',
            message='Message',
        )
        
        notification = Notification.objects.first()
        notification.mark_as_read()
        
        assert notification.is_read is True
        assert notification.read_at is not None