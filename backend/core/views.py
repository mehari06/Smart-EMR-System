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
    UserSerializer,
    ChangePasswordSerializer
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

    def patch(self, request):
        user = request.user
        
        # Extract fields meant for the User model (like phone)
        phone = request.data.get('phone')
        if phone:
            user.phone = phone
            user.save(update_fields=['phone'])
            
        # Extract fields meant for the profile (like profile_photo)
        profile_photo = request.FILES.get('profile_photo')
        if profile_photo:
            if hasattr(user, 'staff_profile'):
                user.staff_profile.profile_photo = profile_photo
                user.staff_profile.save(update_fields=['profile_photo'])
            elif hasattr(user, 'patient_profile'):
                user.patient_profile.profile_photo = profile_photo
                user.patient_profile.save(update_fields=['profile_photo'])
                
        return self.get(request)

class ChangePasswordView(APIView):
    """
    Endpoint for users to change their own password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password successfully updated."}, status=status.HTTP_200_OK)


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
