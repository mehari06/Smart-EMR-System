from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet,
    DepartmentViewSet,
    StaffViewSet,
    CustomTokenObtainPairView,
    CurrentUserView
)

router = DefaultRouter()
router.register('organizations', OrganizationViewSet, basename='organization')
router.register('departments', DepartmentViewSet, basename='department')
router.register('staff', StaffViewSet, basename='staff')

urlpatterns = [
    # Auth Endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    
    # Core API Endpoints
    path('', include(router.urls)),
]
