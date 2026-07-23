"""
Appointments Module — Django Admin
"""

from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient', 'doctor', 'department',
        'scheduled_at', 'status', 'reason', 'created_at'
    ]
    list_filter = ['status', 'department', 'scheduled_at']
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'patient__patient_number',
        'doctor__user__first_name',
        'doctor__user__last_name',
        'reason',
    ]
    ordering = ['scheduled_at']
    readonly_fields = ['created_at']
    autocomplete_fields = ['patient', 'doctor']

    fieldsets = (
        ('Appointment Info', {
            'fields': ('patient', 'doctor', 'department', 'scheduled_at', 'reason'),
        }),
        ('Status & Notes', {
            'fields': ('status', 'notes', 'created_at'),
        }),
    )
