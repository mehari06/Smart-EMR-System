from django.urls import path
from .views import (
    PatientVisitReportView,
    LabReportView,
    RadiologyReportView,
    PatientVisitExcelView,
    PrescriptionReportView,
)

urlpatterns = [
    path('patient/<int:patient_id>/visits/pdf/',
         PatientVisitReportView.as_view(), name='patient-visit-pdf'),
    path('patient/<int:patient_id>/lab/pdf/',
         LabReportView.as_view(), name='lab-pdf'),
    path('patient/<int:patient_id>/radiology/pdf/',
         RadiologyReportView.as_view(), name='radiology-pdf'),
    path('patient/<int:patient_id>/visits/excel/',
         PatientVisitExcelView.as_view(), name='patient-visit-excel'),
    path('patient/<int:patient_id>/prescriptions/pdf/',
         PrescriptionReportView.as_view(), name='prescription-pdf'),
]
