"""
Tests for Reports module.
"""

import pytest
from io import BytesIO

from reports.utils import (
    generate_patient_visit_report,
    generate_lab_report,
    generate_radiology_report,
    generate_patient_visit_excel,
    generate_prescription_report,
)


@pytest.mark.django_db
class TestPDFReports:
    """Test PDF generation."""
    
    def test_generate_patient_visit_report(self, patient, doctor_staff, encounter):
        """Generate patient visit PDF report."""
        buffer = generate_patient_visit_report(patient, [encounter])
        
        assert buffer is not None
        content = buffer.getvalue()
        assert len(content) > 0
        assert content[:4] == b'%PDF'  # PDF magic number
    
    def test_generate_lab_report(self, patient, lab_test, encounter, doctor_staff):
        """Generate lab report PDF."""
        from laboratory.models import LabOrder
        
        lab_order = LabOrder.objects.create(
            encounter=encounter,
            patient=patient,
            ordered_by=doctor_staff,
            test=lab_test,
            status='R',
            result_text='Test result',
        )
        
        buffer = generate_lab_report(patient, [lab_order])
        
        assert buffer is not None
        assert len(buffer.getvalue()) > 0
    
    def test_generate_radiology_report(self, patient, encounter,doctor_staff):
        """Generate radiology report PDF."""
        from clinical.models import RadiologyTest, RadiologyOrder
        
        test = RadiologyTest.objects.create(
            name='Chest X-Ray',
            code='CXR',
        )
        
        order = RadiologyOrder.objects.create(
            encounter=encounter,
            patient=patient,
            test=test,
            ordered_by=doctor_staff,
            status='R',
            result_text='Test result',
        )
        
        buffer = generate_radiology_report(patient, [order])
        
        assert buffer is not None
        assert len(buffer.getvalue()) > 0
    
    def test_generate_prescription_report(self, patient, doctor_staff, encounter, medicine):
        """Generate prescription report PDF."""
        from prescriptions.models import Prescription, PrescriptionItem
        
        prescription = Prescription.objects.create(
            encounter=encounter,
            prescribed_by=doctor_staff,
            status='A',
        )
        
        PrescriptionItem.objects.create(
            prescription=prescription,
            medicine=medicine,
            dosage='500mg',
            frequency='Twice daily',
            duration='7 days',
            quantity=14,
        )
        
        buffer = generate_prescription_report(patient, [prescription])
        
        assert buffer is not None
        assert len(buffer.getvalue()) > 0


@pytest.mark.django_db
class TestExcelReports:
    """Test Excel generation."""
    
    def test_generate_patient_visit_excel(self, patient, doctor_staff, encounter):
        """Generate patient visit Excel report."""
        buffer = generate_patient_visit_excel(patient, [encounter])
        
        assert buffer is not None
        content = buffer.getvalue()
        assert len(content) > 0
        assert content[:2] == b'PK'  # XLSX magic number (ZIP)