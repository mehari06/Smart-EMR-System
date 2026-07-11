"""
Clinical Module — Services
Handles all business logic and state mutations for medical records.
"""
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import MedicalHistory, Encounter, VitalSign, Diagnosis

# ── Medical History ─────────────────────────────────────────────────────

def add_medical_history(*, patient, data: dict, recorded_by=None) -> MedicalHistory:
    """Adds a new record to the patient's medical history."""
    return MedicalHistory.objects.create(
        patient=patient,
        recorded_by=recorded_by,
        **data
    )

def update_medical_history(*, history: MedicalHistory, data: dict) -> MedicalHistory:
    """Updates an existing medical history record."""
    for field, value in data.items():
        setattr(history, field, value)
    history.save()
    return history


# ── Encounters ──────────────────────────────────────────────────────────

@transaction.atomic
def start_encounter(*, patient, doctor, appointment=None, chief_complaint: str) -> Encounter:
    """
    Starts a new clinical encounter.
    If an appointment is provided, its status is updated to Checked In (if not already).
    """
    if appointment:
        from appointments.models import Appointment
        if appointment.status == Appointment.STATUS_SCHEDULED:
            appointment.status = Appointment.STATUS_CHECKED_IN
            appointment.save(update_fields=['status'])

    return Encounter.objects.create(
        patient=patient,
        doctor=doctor,
        appointment=appointment,
        chief_complaint=chief_complaint,
        status=Encounter.STATUS_OPEN
    )

@transaction.atomic
def close_encounter(*, encounter: Encounter, clinical_notes: str = None) -> Encounter:
    """
    Closes the encounter and marks it as completed.
    Also completes the associated appointment.
    """
    if encounter.status != Encounter.STATUS_OPEN:
        raise ValidationError("Only open encounters can be closed.")

    if clinical_notes is not None:
        encounter.clinical_notes = clinical_notes

    encounter.status = Encounter.STATUS_COMPLETED
    encounter.completed_at = timezone.now()
    encounter.save(update_fields=['status', 'completed_at', 'clinical_notes'])

    # Update appointment if it exists
    if encounter.appointment:
        from appointments.models import Appointment
        encounter.appointment.status = Appointment.STATUS_COMPLETED
        encounter.appointment.save(update_fields=['status'])

    return encounter


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

def record_vitals(*, encounter: Encounter, data: dict, recorded_by) -> VitalSign:
    """
    Records or updates vital signs for a given encounter.
    An encounter can only have one set of vitals recorded at a time (OneToOne).
    """
    if hasattr(encounter, 'vitalsign'):
        # Update existing
        vitals = encounter.vitalsign
        for field, value in data.items():
            setattr(vitals, field, value)
        vitals.recorded_by = recorded_by
        vitals.save()
        return vitals
    
    # Create new
    return VitalSign.objects.create(
        encounter=encounter,
        recorded_by=recorded_by,
        **data
    )

def add_diagnosis(*, encounter: Encounter, data: dict, diagnosed_by) -> Diagnosis:
    """Adds a new diagnosis code to the encounter."""
    return Diagnosis.objects.create(
        encounter=encounter,
        diagnosed_by=diagnosed_by,
        **data
    )
