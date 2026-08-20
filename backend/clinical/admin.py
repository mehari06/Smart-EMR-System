"""
Clinical Module — Admin
Django admin interface for Encounters, Medical History, Vitals, and Diagnoses.
"""

from django.contrib import admin
from .models import MedicalHistory, Encounter, VitalSign, Diagnosis

# ── Medical History ─────────────────────────────────────────────────────


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('patient', 'condition_name', 'condition_type',
                    'status', 'onset_date', 'recorded_by')
    list_filter = ('condition_type', 'status', 'recorded_at')
    search_fields = ('patient__patient_number', 'patient__user__first_name',
                     'patient__user__last_name', 'condition_name', 'icd10_code')
    readonly_fields = ('recorded_at', 'updated_at')
    autocomplete_fields = ('patient', 'recorded_by')
    date_hierarchy = 'recorded_at'


# ── Inline Models for Encounter ─────────────────────────────────────────

class VitalSignInline(admin.StackedInline):
    model = VitalSign
    can_delete = False
    max_num = 1
    readonly_fields = ('recorded_at',)
    autocomplete_fields = ('recorded_by',)


class DiagnosisInline(admin.TabularInline):
    model = Diagnosis
    extra = 1
    readonly_fields = ('diagnosed_at',)
    autocomplete_fields = ('diagnosed_by',)


# ── Encounter ───────────────────────────────────────────────────────────

@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', 'status',
                    'started_at', 'completed_at')
    list_filter = ('status', 'started_at')
    search_fields = ('patient__patient_number', 'patient__user__first_name',
                     'patient__user__last_name', 'doctor__user__first_name', 'doctor__user__last_name')
    readonly_fields = ('started_at', 'completed_at')
    autocomplete_fields = ('patient', 'doctor')
    date_hierarchy = 'started_at'

    inlines = [VitalSignInline, DiagnosisInline]

    fieldsets = (
        ('Encounter Details', {
            'fields': ('patient', 'doctor', 'appointment', 'status')
        }),
        ('Clinical Information', {
            # ← added discharge_summary
            'fields': ('chief_complaint', 'clinical_notes', 'discharge_summary')
        }),
        ('Timestamps', {
            'fields': ('started_at', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'doctor__user')


# ── Individual Registers (Optional, but good for direct search) ─────────

@admin.register(VitalSign)
class VitalSignAdmin(admin.ModelAdmin):
    list_display = ('encounter', 'temperature', 'systolic_pressure',
                    'diastolic_pressure', 'recorded_by', 'recorded_at')
    search_fields = ('encounter__patient__patient_number',
                     'encounter__patient__user__first_name')
    autocomplete_fields = ('encounter', 'recorded_by')


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('icd10_code', 'description', 'encounter',
                    'diagnosed_by', 'diagnosed_at')
    search_fields = ('icd10_code', 'description',
                     'encounter__patient__patient_number')
    autocomplete_fields = ('encounter', 'diagnosed_by')
