from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileAttachmentViewSet

router = DefaultRouter()
router.register(r'', FileAttachmentViewSet, basename='attachment')

urlpatterns = [
    path('', include(router.urls)),
]