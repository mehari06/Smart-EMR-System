"""
Tests for Patient Services.
"""

import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from patients.models import Patient, Allergy, PatientAllergy
from patients.services import (
    register_patient,
    update_patient,
    deactivate_patient,
    _generate_patient_number,
)
User = get_user_model()


@pytest.mark.django_db
class TestPatientRegistration:
    """Test patient registration."""
    
    def test_register_patient(self):
        """Register a new patient."""
        user_data = {
            'email': 'newpatient@test.com',
            'password': 'Patient@123',
            'first_name': 'New',
            'last_name': 'Patient',
        }
        patient_data = {
            'date_of_birth': '1995-05-15',
            'gender': 'M',
            'phone': '0912345678',
            'address': 'Test Address',
            'emergency_contact_name': 'Emergency',
            'emergency_contact_phone': '0999999999',
        }
        
        patient = register_patient(
            user_data=user_data,
            patient_data=patient_data,
        )
        
        assert patient.id is not None
        assert patient.user.email == 'newpatient@test.com'
        assert patient.patient_number.startswith('PAT-')
        assert patient.gender == 'M'
    
    def test_register_duplicate_email_fails(self, patient_user):
        """Cannot register with duplicate email."""
        from rest_framework import serializers as drf_serializers
        
        user_data = {
            'email': 'patient@test.com',  # Already exists
            'password': 'Patient@123',
            'first_name': 'Duplicate',
            'last_name': 'Patient',
        }
        patient_data = {
            'date_of_birth': '1995-05-15',
            'gender': 'M',
            'phone': '0912345678',
            'address': 'Test Address',
            'emergency_contact_name': 'Emergency',
            'emergency_contact_phone': '0999999999',
        }
        
        with pytest.raises(drf_serializers.ValidationError):
            register_patient(
                user_data=user_data,
                patient_data=patient_data,
            )


@pytest.mark.django_db
class TestPatientNumberGeneration:
    """Test patient number generation."""
    
    def test_generate_sequential_numbers(self):
        """Patient numbers are sequential when patients are created."""
        # Create first patient
        user1 = User.objects.create_user(
            email='num1@test.com',
            password='Test@123',
            first_name='Num',
            last_name='One',
            role='patient',
        )
        patient1 = Patient.objects.create(
            user=user1,
            patient_number=_generate_patient_number(),
            date_of_birth='1990-01-01',
            gender='M',
            phone='0911111111',
            address='Address 1',
            emergency_contact_name='Emergency',
            emergency_contact_phone='0999999999',
        )
        
        # Create second patient
        user2 = User.objects.create_user(
            email='num2@test.com',
            password='Test@123',
            first_name='Num',
            last_name='Two',
            role='patient',
        )
        patient2 = Patient.objects.create(
            user=user2,
            patient_number=_generate_patient_number(),
            date_of_birth='1990-01-01',
            gender='F',
            phone='0922222222',
            address='Address 2',
            emergency_contact_name='Emergency',
            emergency_contact_phone='0999999999',
        )
        
        assert patient1.patient_number != patient2.patient_number
        assert patient1.patient_number.startswith('PAT-')
        assert patient2.patient_number.startswith('PAT-')
    
    def test_generate_first_patient(self):
        """First patient gets PAT-000001."""
        # If no patients exist
        if Patient.objects.count() == 0:
            number = _generate_patient_number()
            assert number == 'PAT-000001'



@pytest.mark.django_db
class TestUpdatePatient:
    """Test patient updates."""
    
    def test_update_patient(self, patient):
        """Update patient details."""
        updated = update_patient(
            patient=patient,
            data={
                'phone': '0987654321',
                'address': 'New Address',
            },
        )
        
        assert updated.phone == '0987654321'
        assert updated.address == 'New Address'
    
    def test_update_patient_name(self, patient):
        """Update patient name syncs to user."""
        updated = update_patient(
            patient=patient,
            data={
                'first_name': 'Updated',
                'last_name': 'Name',
            },
        )
        
        assert updated.user.first_name == 'Updated'
        assert updated.user.last_name == 'Name'


@pytest.mark.django_db
class TestDeactivatePatient:
    """Test patient deactivation."""
    
    def test_deactivate_patient(self, patient):
        """Deactivate patient."""
        deactivated = deactivate_patient(patient=patient)
        
        assert deactivated.is_active is False
        assert deactivated.user.is_active is False
    
    def test_deactivate_already_inactive(self, patient):
        """Deactivate already inactive patient."""
        deactivate_patient(patient=patient)
        
        # Should still work (idempotent)
        deactivated = deactivate_patient(patient=patient)
        assert deactivated.is_active is False