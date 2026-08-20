"""
Tests for Prescription Services.
"""

import pytest

from prescriptions.models import Prescription, PrescriptionItem, Medicine
from prescriptions.services import create_prescription, _resolve_medicine


@pytest.mark.django_db
class TestResolveMedicine:
    """Test medicine resolution."""
    
    def test_resolve_medicine_by_id(self, medicine):
        """Resolve medicine by ID."""
        resolved = _resolve_medicine(medicine=medicine.id)
        assert resolved == medicine
    
    def test_resolve_medicine_by_name(self):
        """Resolve medicine by name (creates new)."""
        resolved = _resolve_medicine(medicine_name='Paracetamol', dosage='500mg')
        
        assert resolved.name == 'Paracetamol'
        assert resolved.strength == '500mg'
    
    def test_resolve_medicine_creates_unknown(self):
        """Resolve unknown medicine."""
        resolved = _resolve_medicine()
        
        assert resolved.name == 'Unknown Medicine'
    
    def test_resolve_medicine_by_object(self, medicine):
        """Resolve medicine by object."""
        resolved = _resolve_medicine(medicine=medicine)
        assert resolved == medicine


@pytest.mark.django_db
class TestCreatePrescription:
    """Test prescription creation."""
    
    def test_create_prescription_with_items(self, encounter, doctor_staff, medicine):
        """Create prescription with items."""
        items = [
            {
                'medicine': medicine.id,
                'dosage': '500mg',
                'frequency': 'Twice daily',
                'duration': '7 days',
                'quantity': 14,
                'instructions': 'Take after meals',
            }
        ]
        
        prescription = create_prescription(
            encounter=encounter,
            prescribed_by=doctor_staff,
            instructions='General instructions',
            items=items,
        )
        
        assert prescription.id is not None
        assert prescription.status == Prescription.STATUS_ACTIVE
        assert prescription.encounter == encounter
        assert prescription.prescribed_by == doctor_staff
        
        # Check items
        items_count = PrescriptionItem.objects.filter(prescription=prescription).count()
        assert items_count == 1
        
        item = PrescriptionItem.objects.get(prescription=prescription)
        assert item.medicine == medicine
        assert item.dosage == '500mg'
        assert item.quantity == 14
    
    def test_create_prescription_multiple_items(self, encounter, doctor_staff, medicine):
        """Create prescription with multiple items."""
        items = [
            {
                'medicine': medicine.id,
                'dosage': '500mg',
                'frequency': 'Twice daily',
                'duration': '7 days',
                'quantity': 14,
            },
            {
                'medicine_name': 'Ibuprofen',
                'dosage': '400mg',
                'frequency': 'As needed',
                'duration': '3 days',
                'quantity': 10,
            },
        ]
        
        prescription = create_prescription(
            encounter=encounter,
            prescribed_by=doctor_staff,
            items=items,
        )
        
        items_count = PrescriptionItem.objects.filter(prescription=prescription).count()
        assert items_count == 2
    
    def test_create_prescription_with_new_medicine(self, encounter, doctor_staff):
        """Create prescription with new medicine name."""
        items = [
            {
                'medicine_name': 'Vitamin D',
                'dosage': '1000 IU',
                'frequency': 'Once daily',
                'duration': '30 days',
                'quantity': 30,
            }
        ]
        
        prescription = create_prescription(
            encounter=encounter,
            prescribed_by=doctor_staff,
            items=items,
        )
        
        # Check new medicine was created
        medicine = Medicine.objects.filter(name='Vitamin D').first()
        assert medicine is not None