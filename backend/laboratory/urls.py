from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestViewSet, LabOrderViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'tests', LabTestViewSet, basename='labtest')
router.register(r'orders', LabOrderViewSet, basename='laborder')

urlpatterns = [
    path('', include(router.urls)),
]
