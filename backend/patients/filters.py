"""
Patient Management Module — Filters

django-filter FilterSet for the Patient model.
Supports filtering by gender, blood group, and active status.
"""

import django_filters

from .models import Patient


class PatientFilter(django_filters.FilterSet):
    """
    FilterSet for the Patient list endpoint.
    All filters are optional and combinable.
    """

    gender = django_filters.ChoiceFilter(
        choices=Patient.GENDER_CHOICES,
        label="Gender",
    )
    blood_group = django_filters.ChoiceFilter(
        choices=Patient.BLOOD_GROUP_CHOICES,
        label="Blood Group",
    )
    is_active = django_filters.BooleanFilter(
        label="Is Active",
    )
    registered_after = django_filters.DateFilter(
        field_name="registered_at",
        lookup_expr="gte",
        label="Registered After (YYYY-MM-DD)",
    )
    registered_before = django_filters.DateFilter(
        field_name="registered_at",
        lookup_expr="lte",
        label="Registered Before (YYYY-MM-DD)",
    )

    class Meta:
        model = Patient
        fields = ["gender", "blood_group", "is_active"]
