"""
Tests for Appointment Services.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError

from appointments.models import Appointment
from appointments.services import (
    schedule_appointment,
    reschedule_appointment,
    cancel_appointment,
    checkin_patient,
    triage_appointment,
)


@pytest.mark.django_db
class TestScheduleAppointment:
    """Test appointment scheduling."""
    
    def test_schedule_appointment_creates_record(self, patient, doctor_staff, department):
        """Schedule a new appointment."""
        appointment = schedule_appointment(
            patient=patient,
            doctor=doctor_staff,
            department=department,
            scheduled_at=timezone.now() + timedelta(days=1),
            reason='Test reason',
        )
        
        assert appointment.id is not None
        assert appointment.status == Appointment.STATUS_SCHEDULED
        assert appointment.patient == patient
    
    def test_schedule_appointment_without_doctor(self, patient):
        """Schedule without doctor (receptionist flow)."""
        appointment = schedule_appointment(
            patient=patient,
            scheduled_at=timezone.now() + timedelta(days=1),
            reason='Walk-in',
        )
        
        assert appointment.doctor is None
        assert appointment.status == Appointment.STATUS_SCHEDULED
    
    def test_schedule_past_appointment_fails(self, patient, doctor_staff):
        """Cannot schedule in the past."""
        with pytest.raises(ValidationError):
            schedule_appointment(
                patient=patient,
                doctor=doctor_staff,
                scheduled_at=timezone.now() - timedelta(days=1),
                reason='Past appointment',
            )


@pytest.mark.django_db
class TestRescheduleAppointment:
    """Test rescheduling."""
    
    def test_reschedule_scheduled_appointment(self, appointment):
        """Reschedule a scheduled appointment."""
        new_time = timezone.now() + timedelta(days=2)
        
        updated = reschedule_appointment(
            appointment=appointment,
            scheduled_at=new_time,
        )
        
        assert updated.scheduled_at == new_time
    
    def test_reschedule_completed_appointment_fails(self, appointment):
        """Cannot reschedule completed appointment."""
        appointment.status = Appointment.STATUS_COMPLETED
        appointment.save()
        
        with pytest.raises(ValidationError):
            reschedule_appointment(
                appointment=appointment,
                scheduled_at=timezone.now() + timedelta(days=2),
            )


@pytest.mark.django_db
class TestCancelAppointment:
    """Test cancellation."""
    
    def test_cancel_scheduled_appointment(self, appointment):
        """Cancel a scheduled appointment."""
        updated = cancel_appointment(appointment=appointment)
        
        assert updated.status == Appointment.STATUS_CANCELLED
    
    def test_cancel_completed_appointment_fails(self, appointment):
        """Cannot cancel completed appointment."""
        appointment.status = Appointment.STATUS_COMPLETED
        appointment.save()
        
        with pytest.raises(ValidationError):
            cancel_appointment(appointment=appointment)


@pytest.mark.django_db
class TestCheckInPatient:
    """Test patient check-in."""
    
    def test_checkin_scheduled_appointment(self, appointment):
        """Check in a scheduled patient."""
        updated = checkin_patient(appointment=appointment)
        
        assert updated.status == Appointment.STATUS_CHECKED_IN
    
    def test_checkin_cancelled_appointment_fails(self, appointment):
        """Cannot check in cancelled appointment."""
        appointment.status = Appointment.STATUS_CANCELLED
        appointment.save()
        
        with pytest.raises(ValidationError):
            checkin_patient(appointment=appointment)