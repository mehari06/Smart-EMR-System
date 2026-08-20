from rest_framework import permissions

FULL_REPORT_ACCESS_ROLES = frozenset(['admin', 'staff_head', 'nurse'])


class CanViewPatientReport(permissions.BasePermission):
    """
    Patient-report access is limited to admins/staff heads, clinical nurses,
    assigned doctors, and the patient who owns the chart.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, 'role', '')

        if user.is_superuser or role in FULL_REPORT_ACCESS_ROLES:
            return True

        patient = getattr(user, 'patient_profile', None)
        if role == 'patient' and patient:
            return patient.id == obj.id

        staff = getattr(user, 'staff_profile', None)
        if role != 'doctor' or not staff:
            return False

        from clinical.models import Encounter
        from appointments.models import Appointment

        return (
            Encounter.objects.filter(patient=obj, doctor=staff).exists() or
            Appointment.objects.filter(patient=obj, doctor=staff).exists()
        )
