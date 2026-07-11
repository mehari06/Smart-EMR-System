"""
Clinical Module — Selectors
Optimized read-only queries for medical records.
"""

from django.db.models import QuerySet
from .models import MedicalHistory, Encounter, VitalSign, Diagnosis

# ── Medical History ─────────────────────────────────────────────────────

def get_patient_medical_history(patient_id: int) -> QuerySet[MedicalHistory]:
    """
    Returns the complete medical history for a specific patient,
    ordered by most recently recorded.
    """
    return (
        MedicalHistory.objects
        .filter(patient_id=patient_id)
        .select_related('recorded_by')
        .order_by('-recorded_at')
    )


# ── Encounters ──────────────────────────────────────────────────────────

def get_patient_encounters(patient_id: int) -> QuerySet[Encounter]:
    """
    Returns all encounters (visits) for a specific patient.
    Optimized to prefetch vital signs and diagnoses to avoid N+1 queries.
    """
    return (
        Encounter.objects
        .filter(patient_id=patient_id)
        .select_related('doctor', 'appointment')
        .prefetch_related('vitalsign', 'diagnosis_set')
        .order_by('-started_at')
    )

def get_encounter_by_id(encounter_id: int) -> Encounter:
    """
    Returns a single encounter with all its related data prefetched.
    """
    from django.shortcuts import get_object_or_404
    queryset = (
        Encounter.objects
        .select_related('doctor', 'patient', 'appointment')
        .prefetch_related('vitalsign', 'diagnosis_set')
    )
    return get_object_or_404(queryset, pk=encounter_id)


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

def get_encounter_vitals(encounter_id: int) -> VitalSign:
    """Returns vital signs for a specific encounter, if any."""
    from django.shortcuts import get_object_or_404
    return get_object_or_404(VitalSign.objects.select_related('recorded_by'), encounter_id=encounter_id)

def get_encounter_diagnoses(encounter_id: int) -> QuerySet[Diagnosis]:
    """Returns all diagnoses for a specific encounter."""
    return (
        Diagnosis.objects
        .filter(encounter_id=encounter_id)
        .select_related('diagnosed_by')
        .order_by('diagnosed_at')
    )
