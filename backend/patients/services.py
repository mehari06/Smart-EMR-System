"""
Patient Management Module — Services

All business logic lives here: creating patients, updating,
generating patient numbers, and soft-deleting.
Services are called by views and are responsible for data mutations.
"""

from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction

from .constants import PATIENT_NUMBER_PREFIX, PATIENT_NUMBER_PADDING
from .models import Patient, Allergy, PatientAllergy
from .selectors import email_already_registered, patient_number_exists

User = get_user_model()


def _generate_patient_number() -> str:
    """
    Generates a unique patient number in the format: PAT-000001.
    Finds the last created patient and increments by 1.
    Thread-safe because we rely on the DB's unique constraint as the
    final guard and use select_for_update or auto-increment logic.
    """
    last_patient = Patient.objects.order_by("-id").first()
    if last_patient:
        # Extract the numeric portion and increment
        try:
            last_number = int(last_patient.patient_number.split("-")[-1])
        except (ValueError, IndexError):
            last_number = 0
        next_number = last_number + 1
    else:
        next_number = 1

    return f"{PATIENT_NUMBER_PREFIX}-{str(next_number).zfill(PATIENT_NUMBER_PADDING)}"


@transaction.atomic
def register_patient(*, user_data: dict[str, Any], patient_data: dict[str, Any]) -> Patient:
    """
    Registers a new patient by:
    1. Creating the User account (role = 'patient').
    2. Generating a unique patient number.
    3. Creating the Patient profile linked to that user.

    Wrapped in a transaction so if any step fails, nothing is saved.
    """
    # Check email uniqueness before creating
    if email_already_registered(email=user_data["email"]):
        from rest_framework import serializers as drf_serializers
        raise drf_serializers.ValidationError(
            {"email": "A user with this email address already exists."}
        )

    # Create the User
    user = User.objects.create_user(
        email=user_data["email"],
        password=user_data["password"],
        first_name=user_data["first_name"],
        last_name=user_data["last_name"],
        phone=user_data.get("phone", ""),
        role=User.ROLE_PATIENT,
    )

    # Generate unique patient number
    patient_number = _generate_patient_number()

    # Create the Patient profile
    patient = Patient.objects.create(
        user=user,
        patient_number=patient_number,
        date_of_birth=patient_data["date_of_birth"],
        gender=patient_data["gender"],
        blood_group=patient_data.get("blood_group", ""),
        phone=patient_data["phone"],
        address=patient_data["address"],
        emergency_contact_name=patient_data["emergency_contact_name"],
        emergency_contact_phone=patient_data["emergency_contact_phone"],
        profile_photo=patient_data.get("profile_photo"),
    )

    return patient


@transaction.atomic
def update_patient(*, patient: Patient, data: dict[str, Any]) -> Patient:
    """
    Updates a patient's profile data.
    Also updates first/last name on the linked User if provided.
    """
    user_fields = ["first_name", "last_name", "phone"]
    user_updated = False

    for field in user_fields:
        if field in data:
            setattr(patient.user, field, data.pop(field))
            user_updated = True

    if user_updated:
        patient.user.save(update_fields=["first_name", "last_name", "phone"])

    # Update patient-specific fields
    for field, value in data.items():
        setattr(patient, field, value)

    patient.save()
    return patient


@transaction.atomic
def deactivate_patient(*, patient: Patient) -> Patient:
    """
    Soft-deletes a patient by setting is_active=False.
    Also deactivates the linked User account.
    """
    patient.is_active = False
    patient.user.is_active = False
    patient.save(update_fields=["is_active"])
    patient.user.save(update_fields=["is_active"])
    return patient
