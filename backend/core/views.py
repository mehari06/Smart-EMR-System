from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

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
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache

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

        try:
            validate_password(serializer.validated_data['new_password'], user=user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password successfully updated."}, status=status.HTTP_200_OK)

class PasswordResetRequestView(APIView):
    """Handle password reset request."""
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Don't reveal if user exists (security)
            return Response(
                {'detail': 'If this email exists, a reset link has been sent.'},
                status=status.HTTP_200_OK
            )
        
        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Send email
        from notifications.services import notify_password_reset
        reset_token = f"{uid}/{token}"
        notify_password_reset(user, reset_token)
        
        return Response(
            {'detail': 'Password reset link has been sent to your email.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uidb64 or not token or not new_password:
            return Response(
                {'detail': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'detail': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Reset link has expired or is invalid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as exc:
            return Response(
                {'new_password': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'detail': 'Password reset successfully. You can now log in.'},
            status=status.HTTP_200_OK
        )

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return super().get_permissions()

    @method_decorator(cache_page(3600))  # Cache 1 hour
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        cache.clear()
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        cache.clear()
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        cache.clear()
        return response


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return super().get_permissions()

    @method_decorator(cache_page(3600))  # Cache 1 hour
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        cache.clear()
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        cache.clear()
        return response

    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        cache.clear()
        return response


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.select_related('user', 'department').all()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdministrator()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StaffCreateUpdateSerializer
        return StaffSerializer
    @method_decorator(cache_page(1800))  # Cache 30 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        cache.clear()
        return response
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        cache.clear()
        return response
    
    def destroy(self, request, *args, **kwargs):
        response = super().destroy(request, *args, **kwargs)
        cache.clear()
        return response

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        staff = serializer.save()
        
        # Send invitation email
        from notifications.services import notify_account_invitation
        notify_account_invitation(staff.user, staff.user.email)
        
        return Response(
            StaffSerializer(staff).data,
            status=status.HTTP_201_CREATED
        )
