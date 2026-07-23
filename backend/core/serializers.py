from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization, Department, Staff

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Serializer that adds user role and details to the token payload,
    allowing the frontend to know who is logged in without an extra API call.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        
        # If user is staff, add staff_id to token
        if not user.is_patient_role and hasattr(user, 'staff_profile'):
            token['staff_id'] = user.staff_profile.staff_id

        return token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active']
        read_only_fields = ['id', 'role']


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.name')

    class Meta:
        model = Department
        fields = '__all__'


class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Staff
        fields = '__all__'


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)


class StaffCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used specifically for creating or updating a Staff member.
    It handles creating the associated User automatically.
    """
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, write_only=True)

    class Meta:
        model = Staff
        fields = ['staff_id', 'department', 'specialization', 'license_number', 
                  'email', 'first_name', 'last_name', 'password', 'role']

    def create(self, validated_data):
        # Extract user data
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        role = validated_data.pop('role')

        # Create the User
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_staff=True # they are staff users
        )

        # Create the Staff profile
        staff = Staff.objects.create(user=user, **validated_data)
        return staff
