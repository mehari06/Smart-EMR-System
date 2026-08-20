"""
Reports Module - Views
API endpoints to download PDF/Excel reports.
"""

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.views import APIView

from audit.utils import log_action
from clinical.models import Encounter, RadiologyOrder
from laboratory.models import LabOrder
from patients.models import Patient
from prescriptions.models import Prescription
from .permissions import CanViewPatientReport
from .utils import (
    generate_patient_visit_report,
    generate_lab_report,
    generate_radiology_report,
    generate_patient_visit_excel,
    generate_prescription_report,
)


class AuthorizedPatientReportView(APIView):
    permission_classes = [permissions.IsAuthenticated, CanViewPatientReport]

    def get_authorized_patient(self, request, patient_id):
        patient = get_object_or_404(
            Patient.objects.select_related('user'),
            pk=patient_id,
        )
        self.check_object_permissions(request, patient)
        return patient

    def log_export(self, request, patient, details):
        log_action(
            request.user,
            'EXPORT',
            'Patient',
            patient.id,
            str(patient),
            details,
            request,
        )


class PatientVisitReportView(AuthorizedPatientReportView):
    """Download PDF report of all encounters for a patient."""

    def get(self, request, patient_id):
        patient = self.get_authorized_patient(request, patient_id)
        encounters = (
            Encounter.objects
            .filter(patient=patient)
            .select_related('doctor__user')
            .order_by('-started_at')
        )
        pdf_buffer = generate_patient_visit_report(patient, encounters)
        self.log_export(request, patient, 'Exported patient visit PDF report.')

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"patient_visit_report_{patient.patient_number}.pdf",
            content_type='application/pdf',
        )


class LabReportView(AuthorizedPatientReportView):
    """Download PDF report of all lab orders for a patient."""

    def get(self, request, patient_id):
        patient = self.get_authorized_patient(request, patient_id)
        lab_orders = (
            LabOrder.objects
            .filter(encounter__patient=patient)
            .select_related('test')
            .order_by('-ordered_at')
        )
        pdf_buffer = generate_lab_report(patient, lab_orders)
        self.log_export(request, patient, 'Exported patient lab PDF report.')

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"lab_report_{patient.patient_number}.pdf",
            content_type='application/pdf',
        )


class RadiologyReportView(AuthorizedPatientReportView):
    """Download PDF report of all radiology orders for a patient."""

    def get(self, request, patient_id):
        patient = self.get_authorized_patient(request, patient_id)
        radiology_orders = (
            RadiologyOrder.objects
            .filter(encounter__patient=patient)
            .select_related('test')
            .order_by('-ordered_at')
        )
        pdf_buffer = generate_radiology_report(patient, radiology_orders)
        self.log_export(request, patient, 'Exported patient radiology PDF report.')

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"radiology_report_{patient.patient_number}.pdf",
            content_type='application/pdf',
        )


class PrescriptionReportView(AuthorizedPatientReportView):
    """Download PDF report of all prescriptions for a patient."""

    def get(self, request, patient_id):
        patient = self.get_authorized_patient(request, patient_id)
        prescriptions = (
            Prescription.objects
            .filter(encounter__patient=patient)
            .select_related('prescribed_by')
            .prefetch_related('items__medicine')
            .order_by('-prescribed_at')
        )
        pdf_buffer = generate_prescription_report(patient, prescriptions)
        self.log_export(request, patient, 'Exported patient prescription PDF report.')

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"prescription_report_{patient.patient_number}.pdf",
            content_type='application/pdf',
        )


class PatientVisitExcelView(AuthorizedPatientReportView):
    """Download Excel report of all encounters for a patient."""

    def get(self, request, patient_id):
        patient = self.get_authorized_patient(request, patient_id)
        encounters = (
            Encounter.objects
            .filter(patient=patient)
            .select_related('doctor__user')
            .order_by('-started_at')
        )
        excel_buffer = generate_patient_visit_excel(patient, encounters)
        self.log_export(request, patient, 'Exported patient visit Excel report.')

        return FileResponse(
            excel_buffer,
            as_attachment=True,
            filename=f"patient_visit_report_{patient.patient_number}.xlsx",
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
