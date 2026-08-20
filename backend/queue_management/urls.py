"""
Queue Management Module — URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientQueueViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'', PatientQueueViewSet, basename='queue')

urlpatterns = [
    path('', include(router.urls)),
]
