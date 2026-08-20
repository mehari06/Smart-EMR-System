"""
Clinical Module — URLs
API Routing for the Medical Records module.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MedicalHistoryViewSet,
    EncounterViewSet,
    VitalSignViewSet,
    DiagnosisViewSet,
    RadiologyTestViewSet,
    RadiologyOrderViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r'history', MedicalHistoryViewSet, basename='medical-history')
router.register(r'encounters', EncounterViewSet, basename='encounter')
router.register(r'vitals', VitalSignViewSet, basename='vital-sign')
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnosis')
router.register(r'radiology/tests', RadiologyTestViewSet, basename='radiology-test')
router.register(r'radiology/orders', RadiologyOrderViewSet, basename='radiology-order')

urlpatterns = [
    path('', include(router.urls)),
]
