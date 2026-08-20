"""
Patient Management Module — Selectors

All read-only database queries live here.
Views call selectors instead of writing ORM queries inline.
This keeps views thin and makes queries reusable and testable.
"""

from typing import Optional

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404

from .models import Patient


def get_patient_queryset() -> QuerySet:
    return (
        Patient.objects
        .select_related("user")
        .prefetch_related("allergies_set__allergy")
        .only(
            'id', 'patient_number', 'date_of_birth', 'gender',
            'blood_group', 'phone', 'address', 'is_active',
            'registered_at', 'updated_at',
            'user__id', 'user__email', 'user__first_name', 'user__last_name',
        )
    )


def get_active_patients() -> QuerySet:
    """Returns only active patients, optimized."""
    return get_patient_queryset().filter(is_active=True)


def get_patient_list(*, filters: Optional[dict] = None) -> QuerySet:
    """
    Returns the full patient queryset, ready for filtering/searching/ordering
    by the ViewSet. No filtering applied here — the ViewSet handles that.
    """
    return get_patient_queryset()


def get_patient_by_id(*, patient_id: int) -> Patient:
    """
    Returns a single Patient by primary key.
    Raises Http404 if not found.
    """
    return get_object_or_404(get_patient_queryset(), pk=patient_id)


def get_patient_by_number(*, patient_number: str) -> Patient:
    """
    Returns a single Patient by their unique patient number.
    Raises Http404 if not found.
    """
    return get_object_or_404(get_patient_queryset(), patient_number=patient_number)


def patient_number_exists(*, patient_number: str) -> bool:
    """Checks if a patient number is already in use."""
    return Patient.objects.filter(patient_number=patient_number).exists()


def email_already_registered(*, email: str, exclude_user_id: Optional[int] = None) -> bool:
    """
    Checks if an email is already registered.
    Optionally excludes a specific user (for update operations).
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    qs = User.objects.filter(email=email)
    if exclude_user_id:
        qs = qs.exclude(pk=exclude_user_id)
    return qs.exists()
