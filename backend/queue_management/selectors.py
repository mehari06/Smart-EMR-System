"""
Queue Management Module — Selectors
Read-only queries for queue data optimized for dashboard views.
"""

from django.db.models import QuerySet, Count, Q, Case, When, Value, IntegerField
from django.utils import timezone
from datetime import timedelta
from .models import PatientQueue
from .constants import (
    QUEUE_WAITING, QUEUE_IN_TRIAGE, QUEUE_TRIAGED,
    QUEUE_ASSIGNED, QUEUE_IN_PROGRESS, QUEUE_COMPLETED,
    TRIAGE_LEVEL_1, TRIAGE_LEVEL_2, TRIAGE_LEVEL_3,
    TRIAGE_LEVEL_4, TRIAGE_LEVEL_5
)

ACTIVE_STATUSES = [QUEUE_WAITING, QUEUE_IN_TRIAGE,
                   QUEUE_TRIAGED, QUEUE_ASSIGNED, QUEUE_IN_PROGRESS]


def get_active_queue() -> QuerySet:
    """
    Returns all active patients in the queue sorted by clinical priority.
    Priority: Triage level (1 first) → Arrival time (earlier first).
    """
    return (
        PatientQueue.objects
        .filter(current_status__in=ACTIVE_STATUSES)
        .select_related(
            'patient__user',
            'assigned_doctor__user',
            'triaged_by__user',
            'appointment__doctor__user'
        )
        .order_by(
            Case(
                When(triage_level__isnull=True, then=Value(0)),
                When(triage_level=TRIAGE_LEVEL_1, then=Value(1)),
                When(triage_level=TRIAGE_LEVEL_2, then=Value(2)),
                When(triage_level=TRIAGE_LEVEL_3, then=Value(3)),
                When(triage_level=TRIAGE_LEVEL_4, then=Value(4)),
                When(triage_level=TRIAGE_LEVEL_5, then=Value(5)),
                default=Value(6),
                output_field=IntegerField(),
            ),
            'arrival_time'
        )
    )


def get_waiting_for_triage() -> QuerySet:
    """Patients who haven't been triaged yet."""
    return (
        PatientQueue.objects
        .filter(current_status=QUEUE_WAITING, triage_level__isnull=True)
        .select_related('patient__user')
        .order_by('arrival_time')
    )


def get_triaged_waiting() -> QuerySet:
    """Patients triaged but not yet assigned to doctor."""
    return (
        get_active_queue()
        .filter(current_status=QUEUE_TRIAGED)
        .order_by('triage_level', 'triage_completed_at')
    )


def get_doctor_queue(*, doctor_id: int) -> QuerySet:
    """Patients assigned to a specific doctor."""
    return (
        get_active_queue()
        .filter(assigned_doctor_id=doctor_id)
        .order_by('triage_level', 'consultation_started_at')
    )


def get_emergency_patients() -> QuerySet:
    """Level 1 and 2 patients currently in queue."""
    return (
        get_active_queue()
        .filter(triage_level__in=[TRIAGE_LEVEL_1, TRIAGE_LEVEL_2])
    )


def get_queue_by_id(*, queue_id: int) -> PatientQueue:
    """Single queue entry with all relations."""
    from django.shortcuts import get_object_or_404
    return get_object_or_404(
        PatientQueue.objects
        .select_related(
            'patient__user',
            'assigned_doctor__user',
            'triaged_by__user',
            'appointment'
        )
        .prefetch_related('events'),
        pk=queue_id
    )


def get_patient_active_queue(*, patient_id: int) -> PatientQueue:
    """Check if patient has an active queue entry."""
    return PatientQueue.objects.filter(
        patient_id=patient_id,
        current_status__in=ACTIVE_STATUSES
    ).first()


def get_queue_stats():
    """
    Dashboard statistics for the queue.
    Returns counts by triage level and status.
    """
    active = get_active_queue()

    return {
        'total_waiting': active.count(),
        'waiting_for_triage': active.filter(current_status=QUEUE_WAITING).count(),
        'triaged_waiting': active.filter(current_status=QUEUE_TRIAGED).count(),
        'in_consultation': active.filter(current_status=QUEUE_IN_PROGRESS).count(),
        'emergency_cases': active.filter(triage_level__in=[TRIAGE_LEVEL_1, TRIAGE_LEVEL_2]).count(),
        'by_triage_level': {
            'level_1': active.filter(triage_level=TRIAGE_LEVEL_1).count(),
            'level_2': active.filter(triage_level=TRIAGE_LEVEL_2).count(),
            'level_3': active.filter(triage_level=TRIAGE_LEVEL_3).count(),
            'level_4': active.filter(triage_level=TRIAGE_LEVEL_4).count(),
            'level_5': active.filter(triage_level=TRIAGE_LEVEL_5).count(),
            'not_triaged': active.filter(triage_level__isnull=True).count(),
        },
        'average_wait_minutes': _calculate_avg_wait(active),
        'long_waiters': active.filter(
            Q(triage_level=TRIAGE_LEVEL_2, arrival_time__lt=timezone.now() - timedelta(minutes=15)) |
            Q(triage_level=TRIAGE_LEVEL_3, arrival_time__lt=timezone.now() - timedelta(minutes=60)) |
            Q(triage_level=TRIAGE_LEVEL_4, arrival_time__lt=timezone.now() - timedelta(minutes=120)) |
            Q(triage_level=TRIAGE_LEVEL_5,
              arrival_time__lt=timezone.now() - timedelta(minutes=240))
        ).count()
    }


def _calculate_avg_wait(queryset):
    """Calculate average wait time in minutes."""
    total = 0
    count = 0
    now = timezone.now()

    for entry in queryset.filter(arrival_time__isnull=False):
        minutes = int((now - entry.arrival_time).total_seconds() / 60)
        total += minutes
        count += 1

    return int(total / count) if count > 0 else 0
