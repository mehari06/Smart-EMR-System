"""
Laboratory Module — Selectors
Read-only queries for lab orders.
"""

from django.db.models import QuerySet
from .models import LabOrder


def get_all_lab_orders() -> QuerySet:
    return (
        LabOrder.objects
        .select_related(
            'test', 
            'ordered_by__user', 
            'encounter__patient__user',
            'encounter__doctor__user',
            'patient__user',
        )
        .order_by('-ordered_at')
    )


def get_lab_orders_for_encounter(*, encounter_id: int) -> QuerySet:
    """Returns all lab orders for a specific encounter."""
    return (
        LabOrder.objects
        .filter(encounter_id=encounter_id)
        .select_related('test', 'ordered_by__user')
        .prefetch_related('result')
        .order_by('-ordered_at')
    )


def get_lab_orders_for_patient(*, patient_id: int) -> QuerySet:
    """Returns all lab orders for a specific patient."""
    return (
        LabOrder.objects
        .filter(patient_id=patient_id)
        .select_related('test', 'ordered_by__user', 'encounter')
        .prefetch_related('result')
        .order_by('-ordered_at')
    )


def get_lab_order_by_id(*, lab_order_id: int) -> LabOrder:
    """Returns a single lab order by ID with all related data."""
    return (
        LabOrder.objects
        .select_related('test', 'ordered_by__user', 'encounter__patient__user')
        .prefetch_related('result')
        .get(pk=lab_order_id)
    )