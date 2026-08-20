"""
Tests for Queue Management Services.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError

from queue_management.models import PatientQueue, QueueEvent
from queue_management.services import (
    add_to_queue,
    start_triage,
    complete_triage,
    assign_doctor,
    start_consultation,
    complete_visit,
    patient_left,
    transfer_patient,
)
from queue_management.constants import (
    QUEUE_WAITING,
    QUEUE_IN_TRIAGE,
    QUEUE_TRIAGED,
    QUEUE_ASSIGNED,
    QUEUE_IN_PROGRESS,
    QUEUE_COMPLETED,
    QUEUE_LEFT,
    QUEUE_TRANSFERRED,
)


@pytest.mark.django_db
class TestAddToQueue:
    """Test adding patients to queue."""
    
    def test_add_patient_to_queue(self, patient):
        """Add a patient to queue."""
        queue_entry = add_to_queue(
            patient=patient,
            chief_complaint='Headache',
        )
        
        assert queue_entry.id is not None
        assert queue_entry.current_status == QUEUE_WAITING
        assert queue_entry.chief_complaint == 'Headache'
    
    def test_add_patient_already_in_queue_fails(self, patient):
        """Cannot add same patient twice."""
        add_to_queue(patient=patient, chief_complaint='First visit')
        
        with pytest.raises(ValidationError):
            add_to_queue(patient=patient, chief_complaint='Second visit')
    
    def test_queue_event_created(self, patient):
        """Adding to queue creates an event."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Fever')
        
        assert queue_entry.events.count() == 1
        event = queue_entry.events.first()
        assert event.to_status == QUEUE_WAITING


@pytest.mark.django_db
class TestTriageFlow:
    """Test triage workflow."""
    
    def test_start_triage(self, patient):
        """Start triage for waiting patient."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Pain')
        
        updated = start_triage(queue_entry=queue_entry)
        
        assert updated.current_status == QUEUE_IN_TRIAGE
        assert updated.triage_started_at is not None
    
    def test_start_triage_wrong_status_fails(self, patient):
        """Cannot start triage on non-waiting patient."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Pain')
        queue_entry.current_status = QUEUE_TRIAGED
        queue_entry.save()
        
        with pytest.raises(ValidationError):
            start_triage(queue_entry=queue_entry)
    
    def test_complete_triage(self, patient):
        """Complete triage with vitals."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Fever')
        queue_entry = start_triage(queue_entry=queue_entry)
        
        triage_data = {
            'triage_level': 3,
            'chief_complaint': 'Fever',
            'triage_notes': 'Mild fever',
            'pain_score': 5,
            'temperature': 38.5,
            'heart_rate': 90,
        }
        
        updated = complete_triage(
            queue_entry=queue_entry,
            triage_data=triage_data,
        )
        
        assert updated.current_status == QUEUE_TRIAGED
        assert updated.triage_level == 3
        assert updated.temperature == 38.5
        assert updated.pain_score == 5


@pytest.mark.django_db
class TestDoctorAssignment:
    """Test doctor assignment."""
    
    def test_assign_doctor_to_triaged_patient(self, patient, doctor_staff):
        """Assign doctor to a triaged patient."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Checkup')
        queue_entry.current_status = QUEUE_TRIAGED
        queue_entry.triage_level = 4
        queue_entry.save()
        
        updated = assign_doctor(
            queue_entry=queue_entry,
            doctor=doctor_staff,
            room='Room 1',
        )
        
        assert updated.current_status == QUEUE_ASSIGNED
        assert updated.assigned_doctor == doctor_staff
        assert updated.assigned_room == 'Room 1'
    
    def test_assign_doctor_without_triage_fails(self, patient, doctor_staff):
        """Cannot assign doctor before triage."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Checkup')
        
        with pytest.raises(ValidationError):
            assign_doctor(
                queue_entry=queue_entry,
                doctor=doctor_staff,
            )


@pytest.mark.django_db
class TestConsultationFlow:
    """Test consultation workflow."""
    
    def test_start_consultation(self, patient, doctor_staff):
        """Start consultation for assigned patient."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Checkup')
        queue_entry.current_status = QUEUE_ASSIGNED
        queue_entry.triage_level = 4
        queue_entry.assigned_doctor = doctor_staff
        queue_entry.save()
        
        updated = start_consultation(queue_entry=queue_entry)
        
        assert updated.current_status == QUEUE_IN_PROGRESS
        assert updated.consultation_started_at is not None
    
    def test_complete_visit(self, patient, doctor_staff):
        """Complete patient visit."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Checkup')
        queue_entry.current_status = QUEUE_IN_PROGRESS
        queue_entry.triage_level = 4
        queue_entry.assigned_doctor = doctor_staff
        queue_entry.consultation_started_at = timezone.now()
        queue_entry.save()
        
        updated = complete_visit(
            queue_entry=queue_entry,
            disposition='Discharged',
        )
        
        assert updated.current_status == QUEUE_COMPLETED
        assert updated.disposition == 'Discharged'
        assert updated.completed_at is not None


@pytest.mark.django_db
class TestPatientDeparture:
    """Test patient leaving and transfer."""
    
    def test_patient_left(self, patient):
        """Mark patient as left without being seen."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Waited too long')
        
        updated = patient_left(
            queue_entry=queue_entry,
            reason='Left without being seen',
        )
        
        assert updated.current_status == QUEUE_LEFT
        assert updated.left_reason == 'Left without being seen'
    
    def test_transfer_patient(self, patient):
        """Transfer patient to another department."""
        queue_entry = add_to_queue(patient=patient, chief_complaint='Emergency')
        
        updated = transfer_patient(
            queue_entry=queue_entry,
            transfer_to='Emergency Department',
            reason='Needs emergency care',
        )
        
        assert updated.current_status == QUEUE_TRANSFERRED
        assert updated.disposition == 'Transferred to Emergency Department'