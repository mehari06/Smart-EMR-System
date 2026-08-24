import django_filters
from .models import Appointment

class AppointmentFilter(django_filters.FilterSet):
    scheduled_date = django_filters.DateFilter(
        field_name='scheduled_at',
        lookup_expr='date',
    )
    scheduled_after = django_filters.DateFilter(
        field_name='scheduled_at',
        lookup_expr='gte',
    )
    scheduled_before = django_filters.DateFilter(
        field_name='scheduled_at',
        lookup_expr='lte',
    )

    class Meta:
        model = Appointment
        fields = ['patient', 'doctor', 'department', 'status']