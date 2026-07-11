"""
Patient Management Module — Django Admin

Professional admin configuration for Patient, Allergy,
and PatientAllergy models with image preview, fieldsets,
inline models, and optimized queries.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import Patient, Allergy, PatientAllergy


# ── Inline: Allergies inside Patient ────────────────────────────

class PatientAllergyInline(admin.TabularInline):
    model       = PatientAllergy
    extra       = 0
    readonly_fields = ["recorded_at"]
    fields      = ["allergy", "severity", "reaction", "recorded_at"]
    autocomplete_fields = ["allergy"]


# ── Patient Admin ────────────────────────────────────────────────

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    # ── List view ──────────────────────────────────────────
    list_display = [
        "patient_number",
        "get_full_name",
        "get_email",
        "phone",
        "gender",
        "blood_group",
        "is_active",
        "registered_at",
        "photo_preview",
    ]
    list_filter       = ["gender", "blood_group", "is_active", "registered_at"]
    search_fields     = [
        "patient_number",
        "user__first_name",
        "user__last_name",
        "user__email",
        "phone",
    ]
    ordering          = ["-registered_at"]
    readonly_fields   = ["patient_number", "registered_at", "updated_at", "photo_preview"]
    inlines           = [PatientAllergyInline]
    date_hierarchy    = "registered_at"
    list_per_page     = 25

    # ── Optimized queryset ─────────────────────────────────
    def get_queryset(self, request):
        return (
            super().get_queryset(request)
            .select_related("user")
            .prefetch_related("patientallergy_set__allergy")
        )

    # ── Fieldsets ──────────────────────────────────────────
    fieldsets = (
        ("Patient Identity", {
            "fields": ("patient_number", "registered_at", "updated_at", "is_active"),
        }),
        ("Personal Information", {
            "fields": (
                "date_of_birth",
                "gender",
                "blood_group",
                "phone",
                "address",
            ),
        }),
        ("Emergency Contact", {
            "fields": ("emergency_contact_name", "emergency_contact_phone"),
        }),
        ("Profile Photo", {
            "fields": ("profile_photo", "photo_preview"),
        }),
    )

    # ── Computed columns ───────────────────────────────────
    @admin.display(description="Full Name", ordering="user__first_name")
    def get_full_name(self, obj: Patient) -> str:
        return obj.user.get_full_name()

    @admin.display(description="Email", ordering="user__email")
    def get_email(self, obj: Patient) -> str:
        return obj.user.email

    @admin.display(description="Photo")
    def photo_preview(self, obj: Patient):
        if obj.profile_photo:
            return format_html(
                '<img src="{}" style="width:50px; height:50px; '
                'object-fit:cover; border-radius:50%;" />',
                obj.profile_photo.url,
            )
        return "—"


# ── Allergy Admin ────────────────────────────────────────────────

@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display  = ["name", "description"]
    search_fields = ["name"]
    ordering      = ["name"]


# ── PatientAllergy Admin ─────────────────────────────────────────

@admin.register(PatientAllergy)
class PatientAllergyAdmin(admin.ModelAdmin):
    list_display  = ["patient", "allergy", "severity", "reaction", "recorded_at"]
    list_filter   = ["severity", "allergy"]
    search_fields = [
        "patient__patient_number",
        "patient__user__first_name",
        "patient__user__last_name",
        "allergy__name",
    ]
    ordering      = ["-recorded_at"]
    readonly_fields = ["recorded_at"]
    autocomplete_fields = ["allergy", "patient"]

    def get_queryset(self, request):
        return (
            super().get_queryset(request)
            .select_related("patient__user", "allergy")
        )
