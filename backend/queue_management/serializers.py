"""
Queue Management Module — Serializers
"""

from rest_framework import serializers
from .models import PatientQueue, QueueEvent
from patients.serializers import PatientListSerializer
from core.serializers import StaffSerializer


class QueueEventSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source='changed_by.user.get_full_name', read_only=True
    )

    class Meta:
        model = QueueEvent
        fields = [
            'id', 'from_status', 'to_status',
            'changed_by', 'changed_by_name',
            'notes', 'created_at'
        ]


class PatientQueueListSerializer(serializers.ModelSerializer):
    """Compact serializer for queue dashboard list."""
    patient = PatientListSerializer(read_only=True)  # ← Changed
    assigned_doctor_name = serializers.CharField(
        source='assigned_doctor.user.get_full_name', read_only=True
    )
    triaged_by_name = serializers.CharField(
        source='triaged_by.user.get_full_name', read_only=True
    )
    triage_level_display = serializers.CharField(
        source='get_triage_level_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_current_status_display', read_only=True
    )
    wait_time = serializers.IntegerField(
        source='wait_time_so_far', read_only=True)
    is_overdue = serializers.BooleanField(
        source='is_waiting_too_long', read_only=True)

    class Meta:
        model = PatientQueue
        fields = [
            'id', 'patient', 'chief_complaint',
            'triage_level', 'triage_level_display',
            'current_status', 'status_display',
            'pain_score', 'is_fast_track',
            'assigned_doctor', 'assigned_doctor_name',
            'assigned_room',
            'arrival_time', 'wait_time', 'is_overdue',
            'estimated_wait_minutes',
            'triaged_by', 'triaged_by_name',
        ]


class PatientQueueDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer with vitals and events."""
    patient = PatientListSerializer(read_only=True)  # ← Changed
    assigned_doctor = StaffSerializer(read_only=True)
    triaged_by = StaffSerializer(read_only=True)
    triage_level_display = serializers.CharField(
        source='get_triage_level_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_current_status_display', read_only=True
    )
    events = QueueEventSerializer(many=True, read_only=True)
    wait_time = serializers.IntegerField(
        source='wait_time_so_far', read_only=True)
    is_overdue = serializers.BooleanField(
        source='is_waiting_too_long', read_only=True)

    class Meta:
        model = PatientQueue
        fields = [
            'id', 'patient', 'appointment', 'chief_complaint',
            'triage_level', 'triage_level_display',
            'triage_notes',
            # Vitals
            'pain_score', 'temperature', 'heart_rate',
            'systolic_bp', 'diastolic_bp', 'oxygen_saturation',
            'respiratory_rate',
            # Status & Assignment
            'current_status', 'status_display',
            'is_fast_track',
            'assigned_doctor', 'assigned_room',
            # Timestamps
            'arrival_time', 'triage_started_at', 'triage_completed_at',
            'doctor_assigned_at', 'consultation_started_at', 'completed_at',
            # Wait times
            'estimated_wait_minutes', 'actual_wait_minutes',
            'wait_time', 'is_overdue',
            # Staff
            'triaged_by',
            # Disposition
            'disposition', 'left_reason',
            # Related
            'events',
            'updated_at',
        ]


# ── Action Serializers ──────────────────────────────────────

class TriageAssessmentSerializer(serializers.Serializer):
    """Serializer for performing triage on a patient."""
    chief_complaint = serializers.CharField(max_length=255)
    triage_level = serializers.ChoiceField(
        choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)]
    )
    triage_notes = serializers.CharField(required=False, allow_blank=True)

    # Vitals
    pain_score = serializers.IntegerField(
        min_value=0, max_value=10, required=False)
    temperature = serializers.DecimalField(
        max_digits=3, decimal_places=1, required=False)
    heart_rate = serializers.IntegerField(required=False)
    systolic_bp = serializers.IntegerField(required=False)
    diastolic_bp = serializers.IntegerField(required=False)
    oxygen_saturation = serializers.IntegerField(required=False)
    respiratory_rate = serializers.IntegerField(required=False)

    # Flags
    is_fast_track = serializers.BooleanField(default=False)


class AssignDoctorSerializer(serializers.Serializer):
    """Serializer for assigning a doctor to a queued patient."""
    doctor_id = serializers.IntegerField()
    room = serializers.CharField(required=False, allow_blank=True)


class TransferQueueSerializer(serializers.Serializer):
    """Transfer patient to different department/facility."""
    reason = serializers.CharField(max_length=255)
    transfer_to = serializers.CharField(max_length=255)


class MarkLeftSerializer(serializers.Serializer):
    """Patient left without being seen."""
    reason = serializers.CharField(max_length=255)


class QueueCreateSerializer(serializers.Serializer):
    """Add patient to queue (from walk-in or appointment)."""
    patient_id = serializers.IntegerField()
    appointment_id = serializers.IntegerField(required=False)
    chief_complaint = serializers.CharField(max_length=255, required=False)
