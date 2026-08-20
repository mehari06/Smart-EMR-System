"""
Patient Management Module — Serializers

Separate serializers for each use case following Single Responsibility Principle:
- PatientListSerializer    : compact, for list views (GET /patients/)
- PatientDetailSerializer  : full detail, for retrieve view (GET /patients/{id}/)
- PatientCreateSerializer  : for registering a new patient (POST /patients/)
- PatientUpdateSerializer  : for updating a patient (PUT/PATCH /patients/{id}/)
"""

from rest_framework import serializers

from .models import Patient, Allergy, PatientAllergy
from .validators import (
    validate_date_of_birth,
    validate_phone_number,
    validate_profile_photo,
)


# ── Allergy Serializer ───────────────────────────────────────────

class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Allergy
        fields = ["id", "name", "description"]


class PatientAllergySerializer(serializers.ModelSerializer):
    allergy_name    = serializers.ReadOnlyField(source="allergy.name")
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)

    class Meta:
        model  = PatientAllergy
        fields = [
            "id", "allergy", "allergy_name", "patient",
            "severity", "severity_display",
            "reaction", "notes", "recorded_at",
        ]
        read_only_fields = ["id", "recorded_at"]


# ── Embedded User (read-only) ────────────────────────────────────

class EmbeddedUserSerializer(serializers.Serializer):
    """Lightweight read-only user data embedded in patient responses."""
    id         = serializers.IntegerField(read_only=True)
    email      = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name  = serializers.CharField(read_only=True)
    full_name  = serializers.SerializerMethodField()
    phone      = serializers.CharField(read_only=True)

    def get_full_name(self, obj) -> str:
        return obj.get_full_name()


# ── Patient List Serializer ──────────────────────────────────────

class PatientListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for the patient list view.
    Returns only essential fields to keep response payload small.
    """
    full_name           = serializers.SerializerMethodField()
    email               = serializers.ReadOnlyField(source="user.email")
    gender_display      = serializers.CharField(source="get_gender_display", read_only=True)
    blood_group_display = serializers.CharField(source="get_blood_group_display", read_only=True)

    class Meta:
        model  = Patient
        fields = [
            "id",
            "patient_number",
            "full_name",
            "email",
            "phone",
            "gender",
            "gender_display",
            "blood_group",
            "blood_group_display",
            "is_active",
            "registered_at",
        ]

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name()


# ── Patient Detail Serializer ────────────────────────────────────

class PatientDetailSerializer(serializers.ModelSerializer):
    """
    Full-detail serializer for a single patient retrieve view.
    Includes nested user info and related allergies.
    """
    user                = EmbeddedUserSerializer(read_only=True)
    gender_display      = serializers.CharField(source="get_gender_display", read_only=True)
    blood_group_display = serializers.CharField(source="get_blood_group_display", read_only=True)
    allergies           = PatientAllergySerializer(
        source="allergies_set", many=True, read_only=True
    )

    class Meta:
        model  = Patient
        fields = [
            "id",
            "patient_number",
            "user",
            "date_of_birth",
            "gender",
            "gender_display",
            "blood_group",
            "blood_group_display",
            "phone",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "profile_photo",
            "is_active",
            "allergies",
            "registered_at",
            "updated_at",
        ]
        read_only_fields = ["id", "patient_number", "registered_at", "updated_at"]


# ── Patient Create Serializer ────────────────────────────────────

class PatientCreateSerializer(serializers.Serializer):
    """
    Serializer for registering a new patient.
    Accepts user account fields + patient profile fields.
    Delegates creation to services.register_patient().
    """
    # User account fields
    email      = serializers.EmailField()
    password   = serializers.CharField(
        write_only=True, min_length=8, style={"input_type": "password"}
    )
    first_name = serializers.CharField(max_length=150)
    last_name  = serializers.CharField(max_length=150)

    # Patient profile fields
    date_of_birth           = serializers.DateField()
    gender                  = serializers.ChoiceField(choices=Patient.GENDER_CHOICES)
    blood_group             = serializers.ChoiceField(
        choices=Patient.BLOOD_GROUP_CHOICES, required=False, allow_blank=True
    )
    phone                   = serializers.CharField(max_length=20)
    address                 = serializers.CharField()
    emergency_contact_name  = serializers.CharField(max_length=100)
    emergency_contact_phone = serializers.CharField(max_length=20)
    profile_photo           = serializers.ImageField(required=False, allow_null=True)

    def validate_date_of_birth(self, value):
        validate_date_of_birth(value)
        return value

    def validate_phone(self, value: str) -> str:
        validate_phone_number(value)
        return value

    def validate_emergency_contact_phone(self, value: str) -> str:
        validate_phone_number(value)
        return value

    def validate_profile_photo(self, value):
        if value:
            validate_profile_photo(value)
        return value

    def create(self, validated_data: dict) -> Patient:
        from .services import register_patient
        user_data = {
            "email":      validated_data.pop("email"),
            "password":   validated_data.pop("password"),
            "first_name": validated_data.pop("first_name"),
            "last_name":  validated_data.pop("last_name"),
        }
        return register_patient(user_data=user_data, patient_data=validated_data)


# ── Patient Update Serializer ────────────────────────────────────

class PatientUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating an existing patient's profile.
    Patient number and email are immutable after registration.
    Accepts optional first_name / last_name to sync to the linked User.
    """
    first_name = serializers.CharField(max_length=150, required=False)
    last_name  = serializers.CharField(max_length=150, required=False)

    class Meta:
        model  = Patient
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "blood_group",
            "phone",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "profile_photo",
            "is_active",
        ]

    def validate_date_of_birth(self, value):
        validate_date_of_birth(value)
        return value

    def validate_phone(self, value: str) -> str:
        validate_phone_number(value)
        return value

    def validate_emergency_contact_phone(self, value: str) -> str:
        validate_phone_number(value)
        return value

    def validate_profile_photo(self, value):
        if value:
            validate_profile_photo(value)
        return value

    def update(self, instance: Patient, validated_data: dict) -> Patient:
        from .services import update_patient
        return update_patient(patient=instance, data=validated_data)
