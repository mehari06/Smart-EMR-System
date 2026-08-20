"""
Celery tasks for scheduled notifications.
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta


# ── 1. Appointment Reminders ──────────────────────────────────────

@shared_task
def send_appointment_reminders():
    """
    Send appointment reminders:
    - 1 day before appointment
    - 6 hours before appointment
    """
    from appointments.models import Appointment
    from notifications.services import notify_appointment_reminder
    
    now = timezone.now()
    
    # Check for appointments in 24 hours and 6 hours
    reminder_times = [
        now + timedelta(days=1),   # 1 day before
        now + timedelta(hours=6),  # 6 hours before
    ]
    
    for reminder_time in reminder_times:
        # Find appointments scheduled around this time
        appointments = Appointment.objects.filter(
            scheduled_at__gte=reminder_time - timedelta(minutes=30),
            scheduled_at__lte=reminder_time + timedelta(minutes=30),
            status=Appointment.STATUS_SCHEDULED,
        ).select_related('patient__user', 'doctor__user', 'department')
        
        for appointment in appointments:
            patient_user = appointment.patient.user if appointment.patient else None
            if patient_user:
                notify_appointment_reminder(patient_user, appointment)
    
    return f"Sent appointment reminders at {now}"


# ── 2. Daily Schedule Digest ───────────────────────────────────────

@shared_task
def send_daily_schedule_digest():
    """
    Send daily schedule digest to all doctors at 6 AM.
    """
    from core.models import Staff
    from appointments.models import Appointment
    from notifications.services import notify_schedule_digest
    
    today = timezone.localdate()
    
    # Get all active doctors
    doctors = Staff.objects.filter(
        user__role='doctor',
        is_active=True,
    ).select_related('user')
    
    count = 0
    
    for doctor in doctors:
        # Get today's appointments for this doctor
        appointments = Appointment.objects.filter(
            doctor=doctor,
            scheduled_at__date=today,
        ).order_by('scheduled_at')
        
        if appointments.exists():
            notify_schedule_digest(doctor.user, appointments)
            count += 1
    
    return f"Sent schedule digests to {count} doctors"


# ── 3. Medication Reminders ────────────────────────────────────────

@shared_task
def send_medication_reminders():
    """
    Send medication reminders for patients who need them.
    Checks for prescriptions with reminder settings.
    """
    from prescriptions.models import Prescription, PrescriptionItem
    from notifications.services import notify_medication_reminder
    
    now = timezone.now()
    current_hour = now.hour
    current_minute = now.minute
    
    # Get active prescriptions
    active_prescriptions = Prescription.objects.filter(
        status=Prescription.STATUS_ACTIVE,
    ).select_related('encounter__patient__user')
    
    count = 0
    
    for prescription in active_prescriptions:
        patient_user = prescription.encounter.patient.user
        
        for item in prescription.prescriptionitem_set.all():
            # Check frequency and send reminder
            # This is simplified - in production, you'd have more complex logic
            frequency = item.frequency.lower()
            
            should_remind = False
            
            if 'once daily' in frequency and current_hour == 8:
                should_remind = True
            elif 'twice daily' in frequency and current_hour in [8, 20]:
                should_remind = True
            elif 'three times daily' in frequency and current_hour in [8, 14, 20]:
                should_remind = True
            elif 'every 8 hours' in frequency and current_hour in [0, 8, 16]:
                should_remind = True
            
            if should_remind:
                notify_medication_reminder(patient_user, item)
                count += 1
    
    return f"Sent {count} medication reminders"


# ── 4. Weekly Compliance Report ────────────────────────────────────

@shared_task
def send_weekly_compliance_report():
    """
    Send weekly compliance report to admins and privacy officers.
    Every Monday at 7 AM.
    """
    from core.models import User
    from audit.models import AuditLog
    from notifications.services import send_notification
    from notifications.email_service import get_schedule_digest_html
    
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    
    # Get admins
    admins = User.objects.filter(role__in=['admin', 'staff_head'], is_active=True)
    
    # Calculate compliance stats
    total_audit_logs = AuditLog.objects.filter(timestamp__gte=week_ago).count()
    login_count = AuditLog.objects.filter(action='LOGIN', timestamp__gte=week_ago).count()
    export_count = AuditLog.objects.filter(action='EXPORT', timestamp__gte=week_ago).count()
    
    for admin in admins:
        message = (
            f"Weekly Compliance Report:\n"
            f"• Total audit events: {total_audit_logs}\n"
            f"• Login events: {login_count}\n"
            f"• Export events: {export_count}"
        )
        
        send_notification(
            user=admin,
            notification_type='compliance',
            title='📊 Weekly Compliance Report',
            message=message,
            link='/settings',
            priority='normal',
        )
    
    return f"Sent compliance reports to {admins.count()} admins"


# ── 5. No-Show Alerts ──────────────────────────────────────────────

@shared_task
def check_no_shows():
    """
    Check for missed appointments and notify patients.
    """
    from appointments.models import Appointment
    from notifications.services import send_notification
    
    now = timezone.now()
    grace_period = timedelta(minutes=30)
    
    # Find appointments that are past due but still scheduled
    missed_appointments = Appointment.objects.filter(
        scheduled_at__lt=now - grace_period,
        status=Appointment.STATUS_SCHEDULED,
    ).select_related('patient__user')
    
    count = 0
    
    for appointment in missed_appointments:
        # Mark as no-show
        appointment.status = Appointment.STATUS_NO_SHOW
        appointment.save(update_fields=['status'])
        
        # Notify patient
        patient_user = appointment.patient.user if appointment.patient else None
        if patient_user:
            send_notification(
                user=patient_user,
                notification_type='no_show',
                title='⚠️ Missed Appointment',
                message='We noticed you missed your appointment. Please contact us to reschedule.',
                link='/appointments',
                priority='high',
            )
            count += 1
    
    return f"Marked {count} appointments as no-show"