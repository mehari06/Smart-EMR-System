"""
Appointments Module — URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
]
