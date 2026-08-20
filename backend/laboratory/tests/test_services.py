"""
Tests for Laboratory Services.
"""

import pytest
from django.utils import timezone

from laboratory.models import LabTest, LabOrder
from laboratory.services import create_lab_order, receive_lab_results


@pytest.mark.django_db
class TestLabOrderCreation:
    """Test lab order creation."""
    
    def test_create_lab_order(self, encounter, doctor_staff, lab_test):
        """Create a lab order."""
        order = create_lab_order(
            encounter=encounter,
            patient=encounter.patient,
            ordered_by=doctor_staff,
            test=lab_test,
            clinical_notes='Routine checkup',
        )
        
        assert order.id is not None
        assert order.status == LabOrder.STATUS_RESULTS_IN  # Auto-generated result
        assert order.test == lab_test
        assert order.patient == encounter.patient
    
    def test_create_lab_order_generates_result(self, encounter, doctor_staff, lab_test):
        """Lab order auto-generates result text."""
        order = create_lab_order(
            encounter=encounter,
            patient=encounter.patient,
            ordered_by=doctor_staff,
            test=lab_test,
        )
        
        assert order.result_text is not None
        assert len(order.result_text) > 0
        assert order.result_received_at is not None
        assert order.lms_order_id.startswith('LIS-AUTO')
    
    def test_create_lab_order_with_known_test(self, encounter, doctor_staff, lab_test):
        """Known tests get specific result templates."""
        order = create_lab_order(
            encounter=encounter,
            patient=encounter.patient,
            ordered_by=doctor_staff,
            test=lab_test,  # CBC test
        )
        
        assert 'Complete Blood Count' in order.result_text or 'CBC' in order.result_text


@pytest.mark.django_db
class TestReceiveLabResults:
    """Test receiving lab results."""
    
    def test_receive_lab_results(self, encounter, doctor_staff, lab_test):
        """Receive results for a lab order."""
        order = create_lab_order(
            encounter=encounter,
            patient=encounter.patient,
            ordered_by=doctor_staff,
            test=lab_test,
        )
        
        # Simulate manual result update
        updated = receive_lab_results(
            lab_order=order,
            result_text='Updated result text',
            lms_order_id='LIS-MANUAL-123',
        )
        
        assert updated.status == LabOrder.STATUS_RESULTS_IN
        assert updated.result_text == 'Updated result text'
        assert updated.lms_order_id == 'LIS-MANUAL-123'