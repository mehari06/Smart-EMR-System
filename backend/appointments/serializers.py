"""
Appointments Module — Serializers
Translates Appointment model into JSON for the REST API.
Supports: Schedule, Reschedule, Cancel, Assign Doctor, Status Tracking.
"""

from rest_framework import serializers
from django.utils import timezone

from core.models import Staff
from patients.models import Patient
from .models import Appointment


# ── Nested Display Serializers ──────────────────────────────────────────

class DoctorBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    specialization = serializers.CharField(read_only=True)

    class Meta:
        model = Staff
        fields = ['id', 'staff_id', 'full_name', 'specialization']


class PatientBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'patient_number', 'full_name', 'phone']


# ── List Serializer (compact, for GET /appointments/) ──────────────────

class AppointmentListSerializer(serializers.ModelSerializer):
    patient = PatientBriefSerializer(read_only=True)
    doctor = DoctorBriefSerializer(read_only=True)
    triage_nurse = DoctorBriefSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    triage_level_display = serializers.CharField(source='get_triage_level_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'triage_nurse', 'department',
            'scheduled_at', 'reason', 'status', 'status_display',
            'triage_level', 'triage_level_display', 'chief_complaint',
            'triaged_at', 'created_at',
        ]


# ── Detail Serializer (full, for GET /appointments/{id}/) ──────────────

class AppointmentDetailSerializer(serializers.ModelSerializer):
    patient = PatientBriefSerializer(read_only=True)
    doctor = DoctorBriefSerializer(read_only=True)
    triage_nurse = DoctorBriefSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    triage_level_display = serializers.CharField(source='get_triage_level_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor', 'triage_nurse', 'department',
            'scheduled_at', 'reason', 'status', 'status_display',
            'triage_level', 'triage_level_display', 'chief_complaint',
            'triage_notes', 'triaged_at', 'pain_score', 'temperature',
            'heart_rate', 'systolic_bp', 'diastolic_bp',
            'oxygen_saturation', 'respiratory_rate', 'notes', 'created_at',
        ]


# ── Create Serializer (POST /appointments/) ─────────────────────────────

class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Used by staff to schedule a new appointment.
    Validates that the scheduled time is in the future.
    Doctor is optional - can be assigned later during triage.
    """

    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'department', 'triage_nurse', 'scheduled_at', 'reason', 'notes']
        extra_kwargs = {
            'doctor': {'required': False},
            'department': {'required': False},
            'triage_nurse': {'required': False},
        }

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Appointment must be scheduled in the future."
            )
        return value


# ── Reschedule Serializer (PATCH /appointments/{id}/reschedule/) ────────

class AppointmentRescheduleSerializer(serializers.Serializer):
    """
    Used to move an appointment to a new date/time.
    Only the scheduled_at and optional notes are required.
    """
    scheduled_at = serializers.DateTimeField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "Rescheduled time must be in the future."
            )
        return value


# ── Cancel Serializer (PATCH /appointments/{id}/cancel/) ───────────────

class AppointmentCancelSerializer(serializers.Serializer):
    """Accepts an optional cancellation reason stored in notes."""
    notes = serializers.CharField(required=False, allow_blank=True)


# ── Assign Doctor Serializer (PATCH /appointments/{id}/assign_doctor/) ──

class AssignDoctorSerializer(serializers.Serializer):
    """Reassigns the appointment to a different doctor."""
    doctor_id = serializers.PrimaryKeyRelatedField(
        queryset=Staff.objects.filter(user__role='doctor'),
        source='doctor'
    )
    notes = serializers.CharField(required=False, allow_blank=True)


# ── Check-In Serializer (PATCH /appointments/{id}/checkin/) ────────────

class AppointmentCheckInSerializer(serializers.Serializer):
    """Marks the patient as checked-in. No extra fields needed."""
    pass
# ── Triage Serializer (POST /appointments/{id}/triage/) ────────────

class AppointmentTriageSerializer(serializers.Serializer):
    """Nurse triage: complaint, vitals, and doctor assignment."""
    chief_complaint = serializers.CharField(max_length=255)
    triage_level = serializers.ChoiceField(
        choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)]
    )
    triage_notes = serializers.CharField(required=False, allow_blank=True)
    doctor_id = serializers.IntegerField()
    
    # Vitals
    pain_score = serializers.IntegerField(min_value=0, max_value=10, required=False)
    temperature = serializers.DecimalField(max_digits=4, decimal_places=1, required=False)
    heart_rate = serializers.IntegerField(required=False)
    systolic_bp = serializers.IntegerField(required=False)
    diastolic_bp = serializers.IntegerField(required=False)
    oxygen_saturation = serializers.IntegerField(required=False)
    respiratory_rate = serializers.IntegerField(required=False)