"""
Appointments Module — Selectors
Read-only queries for appointment data.
Separates read logic from write logic (Service/Selector pattern).
"""

from django.db.models import QuerySet
from .models import Appointment


def get_all_appointments() -> QuerySet:
    return (
        Appointment.objects
        .select_related('patient__user', 'doctor__user', 'department', 'triage_nurse__user')
        .only(
            'id', 'patient', 'doctor', 'department', 'triage_nurse',
            'scheduled_at', 'reason', 'status', 'created_at',
            'triage_level', 'chief_complaint', 'triaged_at',
            'patient__user__first_name', 'patient__user__last_name',
            'patient__patient_number', 'patient__phone',
            'doctor__user__first_name', 'doctor__user__last_name',
            'doctor__specialization',
            'department__name',
            'triage_nurse__user__first_name', 'triage_nurse__user__last_name',
        )
        .order_by('scheduled_at')
    )

def get_appointments_for_patient(*, patient_id: int) -> QuerySet:
    """Returns all appointments for a specific patient."""
    return (
        Appointment.objects
        .filter(patient_id=patient_id)
        .select_related('patient__user', 'doctor__user', 'department')
        .order_by('-scheduled_at')
    )


def get_appointments_for_doctor(*, doctor_id: int) -> QuerySet:
    """Returns all appointments assigned to a specific doctor."""
    return (
        Appointment.objects
        .filter(doctor_id=doctor_id)
        .select_related('patient__user', 'doctor__user', 'department')
        .order_by('scheduled_at')
    )


def get_todays_appointments() -> QuerySet:
    """Returns all appointments for today's date across all departments."""
    from django.utils import timezone
    today = timezone.localdate()
    return (
        Appointment.objects
        .filter(scheduled_at__date=today)
        .select_related('patient__user', 'doctor__user', 'department')
        .order_by('scheduled_at')
    )


def get_appointment_by_id(*, appointment_id: int) -> Appointment:
    """Returns a single appointment by ID with all related data."""
    return (
        Appointment.objects
        .select_related('patient__user', 'doctor__user', 'department')
        .get(pk=appointment_id)
    )
