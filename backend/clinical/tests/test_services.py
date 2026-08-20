"""
Tests for Clinical Services.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError

from clinical.models import Encounter, VitalSign, Diagnosis, MedicalHistory
from clinical.services import (
    start_encounter,
    close_encounter,
    reopen_encounter,
    record_vitals,
    add_diagnosis,
    add_medical_history,
    update_medical_history,
)


@pytest.mark.django_db
class TestEncounterFlow:
    """Test encounter lifecycle."""
    
    def test_start_encounter(self, patient, doctor_staff):
        """Start a new encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Chest pain',
        )
        
        assert encounter.id is not None
        assert encounter.status == Encounter.STATUS_OPEN
        assert encounter.chief_complaint == 'Chest pain'
        assert encounter.doctor == doctor_staff
    
    def test_close_encounter(self, patient, doctor_staff):
        """Close an open encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Fever',
        )
        
        closed = close_encounter(
            encounter=encounter,
            clinical_notes='Patient treated',
            discharge_summary='Recovered',
        )
        
        assert closed.status == Encounter.STATUS_COMPLETED
        assert closed.clinical_notes == 'Patient treated'
        assert closed.discharge_summary == 'Recovered'
        assert closed.completed_at is not None
    
    def test_close_already_closed_fails(self, patient, doctor_staff):
        """Cannot close an already closed encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Fever',
        )
        close_encounter(encounter=encounter)
        
        with pytest.raises(ValidationError):
            close_encounter(encounter=encounter)
    
    def test_reopen_encounter(self, patient, doctor_staff):
        """Reopen a closed encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Fever',
        )
        close_encounter(encounter=encounter)
        
        reopened = reopen_encounter(encounter=encounter)
        
        assert reopened.status == Encounter.STATUS_OPEN
        assert reopened.completed_at is None


@pytest.mark.django_db
class TestVitals:
    """Test vitals recording."""
    
    def test_record_vitals_new(self, patient, doctor_staff):
        """Record vitals for a new encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Checkup',
        )
        
        vitals_data = {
            'temperature': 36.5,
            'systolic_pressure': 120,
            'diastolic_pressure': 80,
            'pulse_rate': 72,
            'respiratory_rate': 16,
            'oxygen_saturation': 98,
            'height': 170,
            'weight': 70,
        }
        
        vitals = record_vitals(
            encounter=encounter,
            data=vitals_data,
            recorded_by=doctor_staff,
        )
        
        assert vitals.id is not None
        assert vitals.temperature == 36.5
        assert vitals.systolic_pressure == 120
    
    def test_record_vitals_update_existing(self, patient, doctor_staff):
        """Update existing vitals."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Checkup',
        )
        
        vitals_data = {
            'temperature': 36.5,
            'systolic_pressure': 120,
            'diastolic_pressure': 80,
            'pulse_rate': 72,
            'respiratory_rate': 16,
            'oxygen_saturation': 98,
            'height': 170,
            'weight': 70,
        }
        
        record_vitals(encounter=encounter, data=vitals_data, recorded_by=doctor_staff)
        
        # Update with new values
        updated_data = {
            'temperature': 38.5,
            'systolic_pressure': 130,
            'diastolic_pressure': 90,
            'pulse_rate': 90,
            'respiratory_rate': 20,
            'oxygen_saturation': 95,
            'height': 170,
            'weight': 72,
        }
        
        updated = record_vitals(
            encounter=encounter,
            data=updated_data,
            recorded_by=doctor_staff,
        )
        
        assert updated.temperature == 38.5
        assert updated.systolic_pressure == 130
        assert updated.pulse_rate == 90


@pytest.mark.django_db
class TestDiagnosis:
    """Test diagnosis recording."""
    
    def test_add_diagnosis(self, patient, doctor_staff):
        """Add diagnosis to encounter."""
        encounter = start_encounter(
            patient=patient,
            doctor=doctor_staff,
            chief_complaint='Cough',
        )
        
        diagnosis_data = {
            'icd10_code': 'J20.9',
            'description': 'Acute bronchitis',
            'order': 'P',
            'certainty': 'C',
            'diag_status': 'A',
        }
        
        diagnosis = add_diagnosis(
            encounter=encounter,
            data=diagnosis_data,
            diagnosed_by=doctor_staff,
        )
        
        assert diagnosis.id is not None
        assert diagnosis.icd10_code == 'J20.9'
        assert diagnosis.description == 'Acute bronchitis'


@pytest.mark.django_db
class TestMedicalHistory:
    """Test medical history."""
    
    def test_add_medical_history(self, patient, doctor_staff):
        """Add medical history."""
        history_data = {
            'condition_name': 'Hypertension',
            'icd10_code': 'I10',
            'condition_type': 'CH',
            'status': 'A',
        }
        
        history = add_medical_history(
            patient=patient,
            data=history_data,
            recorded_by=doctor_staff,
        )
        
        assert history.id is not None
        assert history.condition_name == 'Hypertension'
        assert history.condition_type == 'CH'
    
    def test_update_medical_history(self, patient, doctor_staff):
        """Update existing medical history."""
        history = add_medical_history(
            patient=patient,
            data={
                'condition_name': 'Hypertension',
                'icd10_code': 'I10',
                'condition_type': 'CH',
                'status': 'A',
            },
            recorded_by=doctor_staff,
        )
        
        updated = update_medical_history(
            history=history,
            data={'status': 'M', 'notes': 'Controlled with medication'},
        )
        
        assert updated.status == 'M'
        assert updated.notes == 'Controlled with medication'