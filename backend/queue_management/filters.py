"""
Queue Management Module — Filters
"""

import django_filters
from .models import PatientQueue


class PatientQueueFilter(django_filters.FilterSet):
    """Filter for queue dashboard."""

    triage_level = django_filters.NumberFilter()
    current_status = django_filters.CharFilter()
    assigned_doctor = django_filters.NumberFilter(
        field_name='assigned_doctor_id')
    is_fast_track = django_filters.BooleanFilter()
    is_emergency = django_filters.BooleanFilter(method='filter_emergency')
    arrived_after = django_filters.DateTimeFilter(
        field_name='arrival_time', lookup_expr='gte'
    )
    arrived_before = django_filters.DateTimeFilter(
        field_name='arrival_time', lookup_expr='lte'
    )

    class Meta:
        model = PatientQueue
        fields = [
            'triage_level', 'current_status', 'assigned_doctor',
            'is_fast_track', 'assigned_room'
        ]

    def filter_emergency(self, queryset, name, value):
        if value:
            return queryset.filter(triage_level__in=[1, 2])
        return queryset
