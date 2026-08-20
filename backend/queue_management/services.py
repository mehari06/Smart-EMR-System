"""
Queue Management Module — Services
Business logic for all queue operations.
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime

from .models import PatientQueue, QueueEvent
from .constants import (
    QUEUE_WAITING, QUEUE_IN_TRIAGE, QUEUE_TRIAGED,
    QUEUE_ASSIGNED, QUEUE_IN_PROGRESS, QUEUE_COMPLETED,
    QUEUE_LEFT, QUEUE_TRANSFERRED,
    TRIAGE_TARGET_WAIT_MINUTES,
    ErrorMessages
)
from .selectors import get_patient_active_queue


def _log_event(queue_entry, from_status, to_status, changed_by=None, notes=''):
    """Internal helper to log queue state changes."""
    return QueueEvent.objects.create(
        queue_entry=queue_entry,
        from_status=from_status,
        to_status=to_status,
        changed_by=changed_by,
        notes=notes
    )


@transaction.atomic
def add_to_queue(*, patient, appointment=None, chief_complaint='', user=None) -> PatientQueue:
    """
    Add a patient to the queue.
    Can be from appointment check-in or walk-in.
    """
    # Check if patient already in active queue
    existing = get_patient_active_queue(patient_id=patient.id)
    if existing:
        raise ValidationError(ErrorMessages.ALREADY_IN_QUEUE)

    queue_entry = PatientQueue.objects.create(
        patient=patient,
        appointment=appointment,
        chief_complaint=chief_complaint,
        current_status=QUEUE_WAITING
    )

    _log_event(
        queue_entry=queue_entry,
        from_status=None,
        to_status=QUEUE_WAITING,
        changed_by=getattr(user, 'staff_profile', None) if user else None,
        notes=f"Patient added to queue. Chief complaint: {chief_complaint}"
    )

    return queue_entry


@transaction.atomic
def start_triage(*, queue_entry: PatientQueue, user=None) -> PatientQueue:
    """
    Mark patient as being triaged.
    Called when nurse begins triage assessment.
    """
    if queue_entry.current_status not in [QUEUE_WAITING]:
        raise ValidationError(
            ErrorMessages.INVALID_STATUS_TRANSITION.format(
                queue_entry.get_current_status_display(), 'In Triage'
            )
        )

    old_status = queue_entry.current_status
    queue_entry.current_status = QUEUE_IN_TRIAGE
    queue_entry.triage_started_at = timezone.now()
    queue_entry.save(update_fields=['current_status', 'triage_started_at'])

    _log_event(queue_entry, old_status, QUEUE_IN_TRIAGE,
               getattr(user, 'staff_profile', None) if user else None,
               "Triage started")

    return queue_entry


@transaction.atomic
def complete_triage(*, queue_entry: PatientQueue, triage_data: dict, user=None) -> PatientQueue:
    """
    Complete triage assessment with vitals and acuity level.
    """
    if queue_entry.current_status != QUEUE_IN_TRIAGE:
        raise ValidationError("Patient must be in triage first.")

    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    # Update triage information
    queue_entry.triage_level = triage_data['triage_level']
    queue_entry.chief_complaint = triage_data.get(
        'chief_complaint', queue_entry.chief_complaint)
    queue_entry.triage_notes = triage_data.get('triage_notes', '')
    queue_entry.pain_score = triage_data.get('pain_score')
    queue_entry.temperature = triage_data.get('temperature')
    queue_entry.heart_rate = triage_data.get('heart_rate')
    queue_entry.systolic_bp = triage_data.get('systolic_bp')
    queue_entry.diastolic_bp = triage_data.get('diastolic_bp')
    queue_entry.oxygen_saturation = triage_data.get('oxygen_saturation')
    queue_entry.respiratory_rate = triage_data.get('respiratory_rate')
    queue_entry.is_fast_track = triage_data.get('is_fast_track', False)
    queue_entry.triaged_by = staff
    queue_entry.triage_completed_at = timezone.now()
    queue_entry.current_status = QUEUE_TRIAGED

    # Calculate estimated wait
    queue_entry.estimated_wait_minutes = _calculate_wait_estimate(queue_entry)

    queue_entry.save()

    _log_event(
        queue_entry, old_status, QUEUE_TRIAGED, staff,
        f"Triage completed. Level: {queue_entry.get_triage_level_display()}. "
        f"Complaint: {queue_entry.chief_complaint}"
    )

    return queue_entry


@transaction.atomic
def assign_doctor(*, queue_entry: PatientQueue, doctor, room='', user=None) -> PatientQueue:
    """
    Assign a doctor to the patient and optionally a room.
    """
    if not queue_entry.is_triaged:
        raise ValidationError(ErrorMessages.TRIAGE_REQUIRED)

    if queue_entry.current_status not in [QUEUE_TRIAGED, QUEUE_ASSIGNED]:
        raise ValidationError(
            ErrorMessages.INVALID_STATUS_TRANSITION.format(
                queue_entry.get_current_status_display(), 'Assigned'
            )
        )

    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    queue_entry.assigned_doctor = doctor
    queue_entry.assigned_room = room or queue_entry.assigned_room
    queue_entry.current_status = QUEUE_ASSIGNED
    queue_entry.doctor_assigned_at = timezone.now()
    queue_entry.save()

    _log_event(
        queue_entry, old_status, QUEUE_ASSIGNED, staff,
        f"Assigned to Dr. {doctor.user.get_full_name()}. Room: {room}"
    )

    return queue_entry


@transaction.atomic
def start_consultation(*, queue_entry: PatientQueue, user=None) -> PatientQueue:
    """
    Mark patient as being seen by doctor.
    """
    if queue_entry.current_status not in [QUEUE_ASSIGNED]:
        raise ValidationError(
            ErrorMessages.INVALID_STATUS_TRANSITION.format(
                queue_entry.get_current_status_display(), 'In Progress'
            )
        )

    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    queue_entry.current_status = QUEUE_IN_PROGRESS
    queue_entry.consultation_started_at = timezone.now()
    queue_entry.save()

    _log_event(queue_entry, old_status, QUEUE_IN_PROGRESS, staff)

    return queue_entry


@transaction.atomic
def complete_visit(*, queue_entry: PatientQueue, disposition='', user=None) -> PatientQueue:
    """
    Mark patient visit as complete.
    """
    if queue_entry.current_status not in [QUEUE_IN_PROGRESS]:
        raise ValidationError(
            ErrorMessages.INVALID_STATUS_TRANSITION.format(
                queue_entry.get_current_status_display(), 'Completed'
            )
        )

    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    queue_entry.current_status = QUEUE_COMPLETED
    queue_entry.completed_at = timezone.now()
    queue_entry.disposition = disposition

    # Calculate actual wait time
    if queue_entry.arrival_time and queue_entry.consultation_started_at:
        delta = queue_entry.consultation_started_at - queue_entry.arrival_time
        queue_entry.actual_wait_minutes = int(delta.total_seconds() / 60)

    queue_entry.save()

    _log_event(
        queue_entry, old_status, QUEUE_COMPLETED, staff,
        f"Visit completed. Disposition: {disposition}"
    )

    return queue_entry


@transaction.atomic
def patient_left(*, queue_entry: PatientQueue, reason='', user=None) -> PatientQueue:
    """
    Patient left without being seen (LWBS).
    """
    if queue_entry.current_status in [QUEUE_COMPLETED, QUEUE_LEFT, QUEUE_TRANSFERRED]:
        raise ValidationError(
            ErrorMessages.INVALID_STATUS_TRANSITION.format(
                queue_entry.get_current_status_display(), 'Left'
            )
        )

    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    queue_entry.current_status = QUEUE_LEFT
    queue_entry.completed_at = timezone.now()
    queue_entry.left_reason = reason
    queue_entry.save()

    _log_event(
        queue_entry, old_status, QUEUE_LEFT, staff,
        f"Patient left. Reason: {reason}"
    )

    return queue_entry


@transaction.atomic
def transfer_patient(*, queue_entry: PatientQueue, transfer_to: str, reason='', user=None) -> PatientQueue:
    """
    Transfer patient to another department or facility.
    """
    old_status = queue_entry.current_status
    staff = getattr(user, 'staff_profile', None) if user else None

    queue_entry.current_status = QUEUE_TRANSFERRED
    queue_entry.completed_at = timezone.now()
    queue_entry.disposition = f"Transferred to {transfer_to}"
    queue_entry.left_reason = reason
    queue_entry.save()

    _log_event(
        queue_entry, old_status, QUEUE_TRANSFERRED, staff,
        f"Transferred to: {transfer_to}. Reason: {reason}"
    )

    return queue_entry


def _calculate_wait_estimate(queue_entry: PatientQueue) -> int:
    """
    Estimate wait time based on:
    - Number of higher priority patients ahead
    - Number of same priority patients who arrived earlier
    - Available doctors (simplified: assume 2)
    """
    # Count patients ahead in queue
    ahead_count = PatientQueue.objects.filter(
        current_status__in=[QUEUE_TRIAGED, QUEUE_ASSIGNED],
        triage_level__lt=queue_entry.triage_level
    ).count()

    same_level_ahead = PatientQueue.objects.filter(
        current_status__in=[QUEUE_TRIAGED, QUEUE_ASSIGNED],
        triage_level=queue_entry.triage_level,
        triage_completed_at__lt=queue_entry.triage_completed_at
    ).count()

    total_ahead = ahead_count + same_level_ahead

    # Average consultation time by triage level (minutes)
    avg_times = {1: 120, 2: 60, 3: 30, 4: 15, 5: 10}
    avg_time = avg_times.get(queue_entry.triage_level, 20)

    available_doctors = 2  # Would be dynamic in production

    return int((total_ahead * avg_time) / available_doctors)
