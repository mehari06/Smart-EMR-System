"""
Queue Management Module — Admin
"""

from django.contrib import admin
from .models import PatientQueue, QueueEvent


class QueueEventInline(admin.TabularInline):
    model = QueueEvent
    extra = 0
    readonly_fields = ['from_status', 'to_status',
                       'changed_by', 'notes', 'created_at']
    can_delete = False
    max_num = 0


@admin.register(PatientQueue)
class PatientQueueAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient', 'triage_level', 'current_status',
        'chief_complaint', 'assigned_doctor', 'arrival_time'
    ]
    list_filter = ['triage_level', 'current_status', 'is_fast_track']
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'patient__patient_number',
        'chief_complaint',
    ]
    readonly_fields = ['arrival_time', 'updated_at']
    inlines = [QueueEventInline]
    date_hierarchy = 'arrival_time'

    fieldsets = (
        ('Patient Info', {
            'fields': ('patient', 'appointment', 'chief_complaint')
        }),
        ('Triage', {
            'fields': (
                'triage_level', 'triage_notes', 'triaged_by',
                'pain_score', 'temperature', 'heart_rate',
                'systolic_bp', 'diastolic_bp', 'oxygen_saturation',
                'respiratory_rate', 'is_fast_track'
            )
        }),
        ('Queue State', {
            'fields': (
                'current_status', 'assigned_doctor', 'assigned_room',
                'estimated_wait_minutes', 'actual_wait_minutes'
            )
        }),
        ('Timestamps', {
            'fields': (
                'arrival_time', 'triage_started_at', 'triage_completed_at',
                'doctor_assigned_at', 'consultation_started_at', 'completed_at'
            )
        }),
        ('Disposition', {
            'fields': ('disposition', 'left_reason')
        }),
    )
