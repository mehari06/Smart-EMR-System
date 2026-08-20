from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('', include(router.urls)),
]
