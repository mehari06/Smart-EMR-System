"""
Appointments Module — Services
Business logic for all appointment mutations.
Uses @transaction.atomic to ensure data integrity.
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Appointment


# ── Schedule ────────────────────────────────────────────────────────────

@transaction.atomic
def schedule_appointment(*, patient, doctor, department, scheduled_at, reason: str, notes: str = '') -> Appointment:
    """Creates a new scheduled appointment."""
    return Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        department=department,
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
    allowed_statuses = [Appointment.STATUS_SCHEDULED, Appointment.STATUS_CHECKED_IN]
    if appointment.status not in allowed_statuses:
        raise ValidationError(
            f"Cannot reschedule a '{appointment.get_status_display()}' appointment. "
            "Only Scheduled or Checked-In appointments can be rescheduled."
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
