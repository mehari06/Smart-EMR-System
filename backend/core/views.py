from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import Organization, Department, Staff
from .serializers import (
    OrganizationSerializer,
    DepartmentSerializer,
    StaffSerializer,
    StaffCreateUpdateSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer
)
from .permissions import IsAdministrator

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that uses the serializer which injects roles into the JWT.
    """
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    """
    Returns the profile details of the currently logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        
        # Attach profile specifics if needed
        if hasattr(user, 'staff_profile'):
            data['staff_details'] = StaffSerializer(user.staff_profile).data
        elif hasattr(user, 'patient_profile'):
            # This would import PatientSerializer from patients app in real life
            data['is_patient'] = True

        return Response(data)


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    # Only admins can edit organizations, anyone authenticated can view
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return super().get_permissions()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return super().get_permissions()


class StaffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Staff (Doctors, Nurses, Pharmacists, Lab Techs, Admins).
    Only Administrators can manage staff.
    """
    queryset = Staff.objects.select_related('user', 'department').all()
    permission_classes = [permissions.IsAuthenticated, IsAdministrator]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StaffCreateUpdateSerializer
        return StaffSerializer
