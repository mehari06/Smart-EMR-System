"""
Clinical Module — Serializers
Translates database models into JSON for the API.
"""

from rest_framework import serializers

from core.models import Staff
from patients.models import Patient
from .models import MedicalHistory, Encounter, VitalSign, Diagnosis, RadiologyTest, RadiologyOrder
from .services import start_encounter, close_encounter, record_vitals, add_diagnosis, add_medical_history, update_medical_history


# ── Nested Display Serializers ──────────────────────────────────────────

class DoctorDisplaySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)

    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'department']


class PatientDisplaySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'patient_number',
                  'full_name', 'gender', 'date_of_birth']


# ── Medical History ─────────────────────────────────────────────────────

class MedicalHistorySerializer(serializers.ModelSerializer):
    condition_type_display = serializers.CharField(
        source='get_condition_type_display', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    recorded_by_name = serializers.CharField(
        source='recorded_by.user.get_full_name', read_only=True)

    class Meta:
        model = MedicalHistory
        fields = [
            'id', 'patient', 'condition_name', 'icd10_code',
            'condition_type', 'condition_type_display',
            'status', 'status_display',
            'onset_date', 'resolution_date', 'notes',
            'recorded_by', 'recorded_by_name',
            'recorded_at', 'updated_at'
        ]
        read_only_fields = ['recorded_by', 'recorded_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        staff_profile = getattr(user, 'staff_profile', None)
        return add_medical_history(
            patient=validated_data.pop('patient'),
            data=validated_data,
            recorded_by=staff_profile
        )

    def update(self, instance, validated_data):
        return update_medical_history(history=instance, data=validated_data)


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

class VitalSignSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(
        source='recorded_by.user.get_full_name', read_only=True)
    bmi = serializers.SerializerMethodField()

    class Meta:
        model = VitalSign
        fields = [
            'id', 'encounter', 'temperature', 'systolic_pressure',
            'diastolic_pressure', 'pulse_rate', 'respiratory_rate',
            'oxygen_saturation', 'height', 'weight', 'bmi',
            'recorded_by', 'recorded_by_name', 'recorded_at'
        ]
        read_only_fields = ['recorded_by', 'recorded_at']

    def get_bmi(self, obj):
        """Return the BMI value from the model."""
        return obj.bmi

    def create(self, validated_data):
        encounter = validated_data.pop('encounter')
        staff_profile = getattr(self.context['request'].user, 'staff_profile', None)
        user = self.context['request'].user
        # data must NOT contain 'encounter' — already popped above
        return record_vitals(
            encounter=encounter,
            data=validated_data,
            recorded_by=staff_profile,
            user=user,
        )


class DiagnosisSerializer(serializers.ModelSerializer):
    diagnosed_by_name = serializers.CharField(
        source='diagnosed_by.user.get_full_name', read_only=True)
    order_display = serializers.CharField(
        source='get_order_display', read_only=True)
    certainty_display = serializers.CharField(
        source='get_certainty_display', read_only=True)
    diag_status_display = serializers.CharField(
        source='get_diag_status_display', read_only=True)

    class Meta:
        model = Diagnosis
        fields = [
            'id', 'encounter', 'icd10_code', 'description',
            'order', 'order_display',
            'certainty', 'certainty_display',
            'diag_status', 'diag_status_display',
            'treatment_plan', 'clinical_notes',
            'diagnosed_by', 'diagnosed_by_name', 'diagnosed_at'
        ]
        read_only_fields = ['diagnosed_by', 'diagnosed_at']

    def create(self, validated_data):
        encounter = validated_data.pop('encounter')
        staff_profile = getattr(self.context['request'].user, 'staff_profile', None)
        user = self.context['request'].user
        # data must NOT contain 'encounter' — already popped above
        return add_diagnosis(
            encounter=encounter,
            data=validated_data,
            diagnosed_by=staff_profile,
            user=user,
        )


# ── Encounters ──────────────────────────────────────────────────────────

class EncounterListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing encounters."""
    patient = PatientDisplaySerializer(read_only=True)
    doctor = DoctorDisplaySerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id', 'patient', 'doctor', 'appointment',
            'status', 'status_display', 'started_at', 'completed_at'
        ]


class EncounterDetailSerializer(serializers.ModelSerializer):
    """Deep serializer for full encounter details including vitals, diagnoses, prescriptions, and lab orders."""
    patient = PatientDisplaySerializer(read_only=True)
    doctor = DoctorDisplaySerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    radiology_orders = serializers.SerializerMethodField()

    # Nested relations
    vitalsign = serializers.SerializerMethodField()
    diagnoses = DiagnosisSerializer(many=True, read_only=True)

    # NEW: Prescriptions and Lab Orders
    prescriptions = serializers.SerializerMethodField()
    lab_orders = serializers.SerializerMethodField()

    class Meta:
        model = Encounter
        fields = [
            'id', 'patient', 'doctor', 'appointment', 'chief_complaint',
            'clinical_notes', 'discharge_summary',  # ← added discharge_summary
            'status', 'status_display',
            'vitalsign', 'diagnoses',
            'prescriptions', 'lab_orders',          # ← added
            'started_at', 'completed_at',
            'radiology_orders',
        ]

    def get_radiology_orders(self, obj):
        return RadiologyOrderSerializer(obj.radiology_orders.all(), many=True).data
    def get_vitalsign(self, obj):
        """Return latest vitals."""
        latest = obj.vital_signs.order_by('-recorded_at').first()
        if latest:
            return VitalSignSerializer(latest).data
        return None

    def get_prescriptions(self, obj):
        from prescriptions.serializers import PrescriptionSerializer
        return PrescriptionSerializer(obj.prescriptions.all(), many=True).data

    def get_lab_orders(self, obj):
        from laboratory.serializers import LabOrderSerializer
        return LabOrderSerializer(obj.lab_orders.all(), many=True).data


class EncounterCreateSerializer(serializers.ModelSerializer):
    """Serializer used specifically for starting a new encounter."""
    class Meta:
        model = Encounter
        fields = ['patient', 'doctor', 'appointment', 'chief_complaint']

    def validate_chief_complaint(self, value):
        if not value or value.strip() == '':
            raise serializers.ValidationError("Chief complaint is required.")
        return value

    def create(self, validated_data):
        user = self.context.get('request') and self.context['request'].user
        doctor = validated_data.get('doctor')
        
        # Auto-assign the logged-in doctor if not explicitly provided
        if not doctor and user and hasattr(user, 'staff_profile') and user.role == user.ROLE_DOCTOR:
            validated_data['doctor'] = user.staff_profile
            
        return start_encounter(**validated_data, user=user)


class EncounterCloseSerializer(serializers.Serializer):
    """Serializer for the custom action to close an encounter."""
    clinical_notes = serializers.CharField(required=False, allow_blank=True)
    discharge_summary = serializers.CharField(
        required=False, allow_blank=True)   # ← NEW FIELD

    def update(self, instance, validated_data):
        notes = validated_data.get('clinical_notes', None)
        summary = validated_data.get(
            'discharge_summary', None)                    # ← NEW
        return close_encounter(
            encounter=instance,
            clinical_notes=notes,
            discharge_summary=summary                                             # ← NEW
        )


class RadiologyTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RadiologyTest
        fields = ['id', 'code', 'name', 'description', 'is_active']


class RadiologyOrderSerializer(serializers.ModelSerializer):
    test = RadiologyTestSerializer(read_only=True)
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=RadiologyTest.objects.all(),
        source='test',
        write_only=True
    )
    ordered_by_name = serializers.CharField(
        source='ordered_by.user.get_full_name', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = RadiologyOrder
        fields = [
            'id', 'encounter', 'patient', 'ordered_by', 'ordered_by_name',
            'test', 'test_id', 'status', 'status_display',
            'clinical_notes', 'ris_order_id', 'result_file', 'result_text',
            'result_received_at', 'ordered_at', 'updated_at'
        ]
        read_only_fields = [
            'ordered_at', 'updated_at', 'status',
            'ris_order_id', 'result_file', 'result_text', 'result_received_at'
        ]


class RadiologyOrderCreateSerializer(serializers.ModelSerializer):
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=RadiologyTest.objects.all(),
        source='test',
        write_only=True,
        required=False
    )
    test = serializers.PrimaryKeyRelatedField(  # ← ADD THIS FIELD
        queryset=RadiologyTest.objects.all(),
        write_only=True,
        required=False
    )

    class Meta:
        model = RadiologyOrder
        fields = ['encounter', 'patient',
                  'ordered_by', 'test_id', 'test','clinical_notes']

    def create(self, validated_data):
        # Handle both 'test' and 'test_id' field names
        if 'test' not in validated_data:
            validated_data['test'] = validated_data.pop('test_id', None)
        return create_radiology_order(**validated_data)
