"""
Attachments Module - Selectors
Read-only queries for file attachments.
"""

from django.db.models import QuerySet
from .models import FileAttachment


ATTACHMENT_SELECT_RELATED = (
    'uploaded_by__user',
    'encounter__doctor',
    'patient__user',
)


def get_all_attachments() -> QuerySet:
    """Returns all attachments with optimized joins."""
    return (
        FileAttachment.objects
        .select_related(*ATTACHMENT_SELECT_RELATED)
        .order_by('-uploaded_at')
    )


def get_attachments_for_encounter(*, encounter_id: int) -> QuerySet:
    """Returns all attachments for a specific encounter."""
    return (
        FileAttachment.objects
        .filter(encounter_id=encounter_id)
        .select_related(*ATTACHMENT_SELECT_RELATED)
        .order_by('-uploaded_at')
    )


def get_attachments_for_patient(*, patient_id: int) -> QuerySet:
    """Returns all attachments for a specific patient."""
    return (
        FileAttachment.objects
        .filter(patient_id=patient_id)
        .select_related(*ATTACHMENT_SELECT_RELATED)
        .order_by('-uploaded_at')
    )


def get_attachment_by_id(*, attachment_id: int) -> FileAttachment:
    """Returns a single attachment by ID with all related data."""
    return (
        FileAttachment.objects
        .select_related(*ATTACHMENT_SELECT_RELATED)
        .get(pk=attachment_id)
    )
