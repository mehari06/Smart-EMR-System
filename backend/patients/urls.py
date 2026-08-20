"""
Patient Management Module — URLs

Routing for the PatientViewSet.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PatientViewSet, AllergyViewSet, PatientAllergyViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'patient-allergies', PatientAllergyViewSet, basename='patient-allergy')
router.register(r'', PatientViewSet, basename='patient')

urlpatterns = [
    path('', include(router.urls)),
]
