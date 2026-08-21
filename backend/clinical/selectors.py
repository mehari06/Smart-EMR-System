"""
Clinical Module — Selectors
Optimized read-only queries for medical records.
"""

from django.db.models import QuerySet
from .models import MedicalHistory, Encounter, VitalSign, Diagnosis, RadiologyOrder

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
    Optimized to prefetch vital signs, diagnoses, prescriptions, and radiology orders.
    """
    return (
        Encounter.objects
        .filter(patient_id=patient_id)
        .select_related('doctor', 'doctor__user', 'appointment', 'vitalsign')
        .prefetch_related('diagnoses', 'diagnoses__diagnosed_by', 'radiology_orders', 'prescriptions')
        .order_by('-started_at')
    )


def get_encounter_by_id(encounter_id: int) -> Encounter:
    from django.shortcuts import get_object_or_404
    queryset = (
        Encounter.objects
        .select_related(
            'doctor', 'doctor__user', 
            'patient', 'patient__user', 
            'appointment', 
            'vitalsign', 'vitalsign__recorded_by__user',
        )
        .prefetch_related(
            'diagnoses', 
            'diagnoses__diagnosed_by__user',
            'radiology_orders__test',
            'radiology_orders__ordered_by__user',
            'prescriptions__prescribed_by__user',
            'prescriptions__items__medicine',
            'lab_orders__test',
            'lab_orders__ordered_by__user',
        )
    )
    return get_object_or_404(queryset, pk=encounter_id)


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

def get_encounter_vitals(encounter_id: int):
    """Returns all vitals for an encounter (latest first)."""
    return (
        VitalSign.objects
        .filter(encounter_id=encounter_id)
        .select_related('recorded_by', 'recorded_by__user')
        .order_by('-recorded_at')
    )


def get_encounter_diagnoses(encounter_id: int) -> QuerySet[Diagnosis]:
    """Returns all diagnoses for a specific encounter."""
    return (
        Diagnosis.objects
        .filter(encounter_id=encounter_id)
        .select_related('diagnosed_by', 'diagnosed_by__user')
        .order_by('diagnosed_at')
    )


def get_radiology_orders_for_encounter(encounter_id: int) -> QuerySet[RadiologyOrder]:
    """Returns all radiology orders for a specific encounter."""
    return RadiologyOrder.objects.filter(
        encounter_id=encounter_id
    ).select_related('test', 'ordered_by', 'ordered_by__user')
