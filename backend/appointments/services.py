"""
Appointments Module — Services
Business logic for all appointment mutations.
Uses @transaction.atomic to ensure data integrity.
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from .models import Appointment


def _assert_doctor_available(*, doctor, scheduled_at, exclude_appointment_id=None) -> None:
    if not doctor or not scheduled_at:
        return

    start = scheduled_at - timedelta(hours=1)
    end = scheduled_at + timedelta(hours=1)
    conflicts = Appointment.objects.filter(
        doctor=doctor,
        scheduled_at__gt=start,
        scheduled_at__lt=end,
    ).exclude(status__in=[Appointment.STATUS_CANCELLED, Appointment.STATUS_NO_SHOW])

    if exclude_appointment_id:
        conflicts = conflicts.exclude(pk=exclude_appointment_id)

    if conflicts.exists():
        raise ValidationError('Doctor already has an appointment within this one-hour time slot.')


# ── Schedule ────────────────────────────────────────────────────────────
@transaction.atomic
def schedule_appointment(*, patient, scheduled_at, reason: str, doctor=None, department=None, triage_nurse=None, notes: str = '') -> Appointment:
    """Creates a new scheduled appointment. Auto-derives department from doctor if omitted."""

    # Validate appointment is in the future
    if scheduled_at <= timezone.now():
        raise ValidationError("Appointment must be scheduled in the future.")

    if not department and doctor and hasattr(doctor, 'department'):
        department = doctor.department

    if doctor:
        _assert_doctor_available(doctor=doctor, scheduled_at=scheduled_at)

    return Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        department=department,
        triage_nurse=triage_nurse,
        scheduled_at=scheduled_at,
        reason=reason,
        notes=notes,
        status=Appointment.STATUS_SCHEDULED,
    )

# ── Reschedule ──────────────────────────────────────────────────────────

@transaction.atomic
def reschedule_appointment(*, appointment: Appointment, scheduled_at, notes: str = None) -> Appointment:
    """
    Moves an appointment to a new date/time.
    Only Scheduled or Checked-In appointments can be rescheduled.
    """
    allowed_statuses = [Appointment.STATUS_SCHEDULED,
                        Appointment.STATUS_CHECKED_IN]
    if appointment.status not in allowed_statuses:
        raise ValidationError(
            f"Cannot reschedule a '{appointment.get_status_display()}' appointment. "
            "Only Scheduled or Checked-In appointments can be rescheduled."
        )

    _assert_doctor_available(
        doctor=appointment.doctor,
        scheduled_at=scheduled_at,
        exclude_appointment_id=appointment.id,
    )

    appointment.scheduled_at = scheduled_at
    if notes is not None:
        appointment.notes = notes
    appointment.save(update_fields=['scheduled_at', 'notes'])
    return appointment


# ── Cancel ──────────────────────────────────────────────────────────────

@transaction.atomic
def cancel_appointment(*, appointment: Appointment, notes: str = None) -> Appointment:
    """
    Cancels an appointment.
    Completed or already-cancelled appointments cannot be cancelled.
    """
    if appointment.status in [Appointment.STATUS_COMPLETED, Appointment.STATUS_CANCELLED]:
        raise ValidationError(
            f"Cannot cancel a '{appointment.get_status_display()}' appointment."
        )

    appointment.status = Appointment.STATUS_CANCELLED
    if notes is not None:
        appointment.notes = notes
    appointment.save(update_fields=['status', 'notes'])
    return appointment


# ── Assign Doctor ────────────────────────────────────────────────────────

@transaction.atomic
def assign_doctor(*, appointment: Appointment, doctor, notes: str = None) -> Appointment:
    """
    Assigns or reassigns a doctor to an appointment.
    Only allowed for Scheduled appointments.
    """
    if appointment.status not in [Appointment.STATUS_SCHEDULED]:
        raise ValidationError(
            "Doctor can only be assigned to a Scheduled appointment."
        )

    _assert_doctor_available(
        doctor=doctor,
        scheduled_at=appointment.scheduled_at,
        exclude_appointment_id=appointment.id,
    )

    appointment.doctor = doctor
    if notes is not None:
        appointment.notes = notes
    appointment.save(update_fields=['doctor', 'notes'])
    return appointment


# ── Check-In ─────────────────────────────────────────────────────────────

@transaction.atomic
def checkin_patient(*, appointment: Appointment) -> Appointment:
    """
    Marks the patient as physically arrived and checked in.
    Only Scheduled appointments can be checked in.
    """
    if appointment.status != Appointment.STATUS_SCHEDULED:
        raise ValidationError(
            f"Only a Scheduled appointment can be checked in. "
            f"This appointment is currently '{appointment.get_status_display()}'."
        )

    appointment.status = Appointment.STATUS_CHECKED_IN
    appointment.save(update_fields=['status'])
    return appointment


# ── Triage ─────────────────────────────────────────────────────────────

@transaction.atomic
def triage_appointment(*, appointment: Appointment, triage_data: dict, user=None) -> Appointment:
    """
    Nurse performs triage on a checked-in patient.
    Records chief complaint, triage level, vitals, and assigns doctor.
    """
    if appointment.status != Appointment.STATUS_CHECKED_IN:
        raise ValidationError(
            f"Cannot triage a '{appointment.get_status_display()}' appointment. "
            "Only Checked-In appointments can be triaged."
        )

    from core.models import Staff

    triage_nurse = getattr(user, 'staff_profile', None) if user else None
    if triage_nurse and getattr(triage_nurse.user, 'role', None) != 'nurse':
        triage_nurse = appointment.triage_nurse

    doctor_id = triage_data.get('doctor_id')
    if doctor_id:
        try:
            appointment.doctor = Staff.objects.get(pk=doctor_id, user__role='doctor')
        except Staff.DoesNotExist:
            raise ValidationError(f"Doctor with ID {doctor_id} not found.")

    appointment.triage_nurse = triage_nurse or appointment.triage_nurse
    appointment.triage_level = triage_data.get('triage_level')
    appointment.chief_complaint = triage_data.get('chief_complaint', '')
    appointment.triage_notes = triage_data.get('triage_notes', '')
    appointment.reason = appointment.chief_complaint or appointment.reason
    appointment.notes = appointment.triage_notes or appointment.notes
    appointment.pain_score = triage_data.get('pain_score')
    appointment.temperature = triage_data.get('temperature')
    appointment.heart_rate = triage_data.get('heart_rate')
    appointment.systolic_bp = triage_data.get('systolic_bp')
    appointment.diastolic_bp = triage_data.get('diastolic_bp')
    appointment.oxygen_saturation = triage_data.get('oxygen_saturation')
    appointment.respiratory_rate = triage_data.get('respiratory_rate')
    appointment.status = Appointment.STATUS_TRIAGED
    appointment.triaged_at = timezone.now()
    appointment.save(update_fields=[
        'doctor', 'triage_nurse', 'triage_level', 'chief_complaint',
        'triage_notes', 'reason', 'notes', 'pain_score', 'temperature',
        'heart_rate', 'systolic_bp', 'diastolic_bp', 'oxygen_saturation',
        'respiratory_rate', 'status', 'triaged_at'
    ])

    return appointment