"""
Notification Service - Sends emails and creates in-app notifications.
"""

from django.db import transaction
from django.conf import settings

from .models import Notification
from .email_service import (
    ResendEmailService,
    get_appointment_reminder_html,
    get_lab_result_html,
    get_medication_reminder_html,
    get_password_reset_html,
    get_schedule_digest_html,
    get_account_invitation_html,
)


def send_notification(*, user, notification_type, title, message, link='', priority='normal', email_html=None, email_subject=None):
    """
    Create in-app notification AND send email.
    
    Args:
        user: User object
        notification_type: Type of notification
        title: Short title
        message: Message body
        link: Optional URL
        priority: low, normal, high, urgent
        email_html: Optional HTML content for email
        email_subject: Optional email subject
    """
    # 1. Create in-app notification
    Notification.objects.create(
        recipient=user,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        priority=priority,
    )
    
    # 2. Send email
    if email_html and email_subject:
        ResendEmailService.send(
            to_email=user.email,
            subject=email_subject,
            html_content=email_html,
        )


# ── Convenience Functions ───────────────────────────────────────

def notify_appointment_reminder(user, appointment):
    """Send appointment reminder."""
    from datetime import timedelta
    from django.utils import timezone
    
    time_until = appointment.scheduled_at - timezone.now()
    hours_until = int(time_until.total_seconds() / 3600)
    
    patient_name = user.get_full_name()
    appointment_date = appointment.scheduled_at.strftime('%B %d, %Y')
    appointment_time = appointment.scheduled_at.strftime('%I:%M %p')
    doctor_name = appointment.doctor.user.get_full_name() if appointment.doctor else 'TBD'
    department = appointment.department.name if appointment.department else 'General'
    location = 'Main Clinic'
    
    email_html = get_appointment_reminder_html(
        patient_name=patient_name,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        doctor_name=doctor_name,
        department=department,
        location=location,
    )
    
    send_notification(
        user=user,
        notification_type='appointment_reminder',
        title='📅 Appointment Reminder',
        message=f'You have an appointment in {hours_until} hours.',
        link='/appointments',
        priority='high',
        email_html=email_html,
        email_subject=f'📅 Appointment Reminder - {appointment_date}',
    )


def notify_lab_result_ready(user, lab_order):
    """Notify patient that lab result is verified and available."""
    
    patient_name = user.get_full_name()
    test_name = lab_order.test.name if lab_order.test else 'Lab Test'
    verified_by = lab_order.verified_by.user.get_full_name() if lab_order.verified_by else 'Your Physician'
    verified_date = lab_order.verified_at.strftime('%B %d, %Y') if lab_order.verified_at else 'Today'
    
    email_html = get_lab_result_html(
        patient_name=patient_name,
        test_name=test_name,
        verified_by=verified_by,
        verified_date=verified_date,
    )
    
    send_notification(
        user=user,
        notification_type='lab_result',
        title='🔬 Lab Result Available',
        message=f'Your {test_name} result has been verified and is now available.',
        link='/lab-results',
        priority='high',
        email_html=email_html,
        email_subject='🔬 Your Lab Result is Ready',
    )


def notify_medication_reminder(user, prescription_item):
    """Send medication reminder."""
    
    patient_name = user.get_full_name()
    medication_name = prescription_item.medicine.name if prescription_item.medicine else 'Medication'
    dosage = prescription_item.dosage
    frequency = prescription_item.frequency
    
    email_html = get_medication_reminder_html(
        patient_name=patient_name,
        medication_name=medication_name,
        dosage=dosage,
        frequency=frequency,
    )
    
    send_notification(
        user=user,
        notification_type='drug_reminder',
        title='💊 Medication Reminder',
        message=f'Time to take {medication_name} ({dosage}).',
        link='/medications',
        priority='normal',
        email_html=email_html,
        email_subject='💊 Medication Reminder',
    )


def notify_password_reset(user, reset_token):
    """Send password reset email."""
    
    user_name = user.get_full_name() or user.email
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    expiry_minutes = 30
    
    email_html = get_password_reset_html(
        user_name=user_name,
        reset_link=reset_link,
        expiry_minutes=expiry_minutes,
    )
    
    send_notification(
        user=user,
        notification_type='password_reset',
        title='🔐 Password Reset',
        message='Password reset requested.',
        priority='urgent',
        email_html=email_html,
        email_subject='🔐 Reset Your Password',
    )


def notify_schedule_digest(user, appointments):
    """Send daily schedule digest to doctor."""
    
    doctor_name = user.last_name or 'Doctor'
    appointment_count = len(appointments)
    first_time = appointments[0].scheduled_at.strftime('%I:%M %p') if appointments else 'N/A'
    last_time = appointments[-1].scheduled_at.strftime('%I:%M %p') if appointments else 'N/A'
    
    email_html = get_schedule_digest_html(
        doctor_name=doctor_name,
        appointment_count=appointment_count,
        first_appointment_time=first_time,
        last_appointment_time=last_time,
    )
    
    send_notification(
        user=user,
        notification_type='schedule_digest',
        title='📋 Daily Schedule',
        message=f'You have {appointment_count} appointments today.',
        link='/appointments',
        priority='normal',
        email_html=email_html,
        email_subject=f'📋 Your Schedule - {appointment_count} Appointments Today',
    )
def notify_account_invitation(user, email):
    """Send account invitation email to new staff."""
    from .email_service import get_account_invitation_html
    
    user_name = user.get_full_name() or email
    login_url = f"{settings.FRONTEND_URL}/login"
    
    email_html = get_account_invitation_html(
        user_name=user_name,
        email=email,
        login_url=login_url,
    )
    
    send_notification(
        user=user,
        notification_type='account_invitation',
        title='👋 Welcome to Smart EMR',
        message='Your account has been created. Please log in to get started.',
        link='/login',
        priority='high',
        email_html=email_html,
        email_subject='👋 Welcome to Smart EMR',
    )