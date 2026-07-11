"""
Clinical Module — Serializers
Translates database models into JSON for the API.
"""

from rest_framework import serializers

from core.models import Staff
from patients.models import Patient
from .models import MedicalHistory, Encounter, VitalSign, Diagnosis
from .services import start_encounter, close_encounter, record_vitals, add_diagnosis, add_medical_history, update_medical_history


# ── Nested Display Serializers ──────────────────────────────────────────

class DoctorDisplaySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'department']

class PatientDisplaySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = Patient
        fields = ['id', 'patient_number', 'full_name', 'gender', 'date_of_birth']


# ── Medical History ─────────────────────────────────────────────────────

class MedicalHistorySerializer(serializers.ModelSerializer):
    condition_type_display = serializers.CharField(source='get_condition_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

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
        return add_medical_history(
            patient=validated_data.pop('patient'),
            data=validated_data,
            recorded_by=self.context['request'].user
        )

    def update(self, instance, validated_data):
        return update_medical_history(history=instance, data=validated_data)


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

class VitalSignSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.user.get_full_name', read_only=True)

    class Meta:
        model = VitalSign
        fields = [
            'id', 'encounter', 'temperature', 'systolic_pressure', 
            'diastolic_pressure', 'pulse_rate', 'respiratory_rate', 
            'oxygen_saturation', 'height', 'weight', 
            'recorded_by', 'recorded_by_name', 'recorded_at'
        ]
        read_only_fields = ['recorded_by', 'recorded_at']

    def create(self, validated_data):
        # We assume the user creates vitals through an encounter-nested approach or passing encounter_id
        encounter = validated_data.pop('encounter')
        staff_profile = getattr(self.context['request'].user, 'staff_profile', None)
        return record_vitals(encounter=encounter, data=validated_data, recorded_by=staff_profile)


class DiagnosisSerializer(serializers.ModelSerializer):
    diagnosed_by_name = serializers.CharField(source='diagnosed_by.user.get_full_name', read_only=True)

    class Meta:
        model = Diagnosis
        fields = [
            'id', 'encounter', 'icd10_code', 'description', 
            'treatment_plan', 'clinical_notes', 
            'diagnosed_by', 'diagnosed_by_name', 'diagnosed_at'
        ]
        read_only_fields = ['diagnosed_by', 'diagnosed_at']

    def create(self, validated_data):
        encounter = validated_data.pop('encounter')
        staff_profile = getattr(self.context['request'].user, 'staff_profile', None)
        return add_diagnosis(encounter=encounter, data=validated_data, diagnosed_by=staff_profile)


# ── Encounters ──────────────────────────────────────────────────────────

class EncounterListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing encounters."""
    patient = PatientDisplaySerializer(read_only=True)
    doctor = DoctorDisplaySerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id', 'patient', 'doctor', 'appointment', 
            'status', 'status_display', 'started_at', 'completed_at'
        ]

class EncounterDetailSerializer(serializers.ModelSerializer):
    """Deep serializer for full encounter details including vitals and diagnoses."""
    patient = PatientDisplaySerializer(read_only=True)
    doctor = DoctorDisplaySerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Nested relations
    vitalsign = VitalSignSerializer(read_only=True)
    diagnoses = DiagnosisSerializer(source='diagnosis_set', many=True, read_only=True)

    class Meta:
        model = Encounter
        fields = [
            'id', 'patient', 'doctor', 'appointment', 'chief_complaint', 
            'clinical_notes', 'status', 'status_display', 
            'vitalsign', 'diagnoses',
            'started_at', 'completed_at'
        ]

class EncounterCreateSerializer(serializers.ModelSerializer):
    """Serializer used specifically for starting a new encounter."""
    class Meta:
        model = Encounter
        fields = ['patient', 'doctor', 'appointment', 'chief_complaint']

    def create(self, validated_data):
        return start_encounter(**validated_data)

class EncounterCloseSerializer(serializers.Serializer):
    """Serializer for the custom action to close an encounter."""
    clinical_notes = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        notes = validated_data.get('clinical_notes', None)
        return close_encounter(encounter=instance, clinical_notes=notes)
