"""
Tests for Attachments module.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from attachments.models import FileAttachment
from attachments.selectors import (
    get_all_attachments,
    get_attachments_for_encounter,
    get_attachments_for_patient,
    get_attachment_by_id,
)


@pytest.mark.django_db
class TestAttachmentSelectors:
    """Test attachment selector functions."""
    
    def test_get_all_attachments_empty(self):
        """Get all attachments when none exist."""
        attachments = get_all_attachments()
        assert attachments.count() == 0
    
    def test_get_attachments_for_patient(self, patient, doctor_staff, encounter):
        """Get attachments for a specific patient."""
        # Create test file
        test_file = SimpleUploadedFile(
            "test.pdf",
            b"Test file content",
            content_type="application/pdf"
        )
        
        attachment = FileAttachment.objects.create(
            encounter=encounter,
            patient=patient,
            uploaded_by=doctor_staff,
            file=test_file,
            file_type='other',
            description='Test attachment',
        )
        
        attachments = get_attachments_for_patient(patient_id=patient.id)
        assert attachments.count() == 1
        assert attachments.first().description == 'Test attachment'
    
    def test_get_attachments_for_encounter(self, patient, doctor_staff, encounter):
        """Get attachments for a specific encounter."""
        test_file = SimpleUploadedFile(
            "test2.pdf",
            b"Test content",
            content_type="application/pdf"
        )
        
        FileAttachment.objects.create(
            encounter=encounter,
            patient=patient,
            uploaded_by=doctor_staff,
            file=test_file,
            file_type='lab_report',
            description='Lab result',
        )
        
        attachments = get_attachments_for_encounter(encounter_id=encounter.id)
        assert attachments.count() == 1
        assert attachments.first().file_type == 'lab_report'
    
    def test_get_attachment_by_id(self, patient, doctor_staff, encounter):
        """Get a single attachment by ID."""
        test_file = SimpleUploadedFile(
            "test3.pdf",
            b"Test",
            content_type="application/pdf"
        )
        
        attachment = FileAttachment.objects.create(
            encounter=encounter,
            patient=patient,
            uploaded_by=doctor_staff,
            file=test_file,
            file_type='consent_form',
        )
        
        fetched = get_attachment_by_id(attachment_id=attachment.id)
        assert fetched.id == attachment.id
        assert fetched.file_type == 'consent_form'


@pytest.mark.django_db
class TestAttachmentPermissions:
    """Test attachment permissions."""
    
    def test_attachment_has_uploaded_by(self, patient, doctor_staff, encounter):
        """Attachment tracks uploader."""
        test_file = SimpleUploadedFile(
            "test4.pdf",
            b"Test",
            content_type="application/pdf"
        )
        
        attachment = FileAttachment.objects.create(
            encounter=encounter,
            patient=patient,
            uploaded_by=doctor_staff,
            file=test_file,
            file_type='other',
        )
        
        assert attachment.uploaded_by == doctor_staff