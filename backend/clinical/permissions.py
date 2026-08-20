"""
Clinical Module — Permissions
Security rules for accessing clinical records and encounters.
"""

from rest_framework import permissions

FULL_CLINICAL_ACCESS_ROLES = frozenset(['admin', 'staff_head', 'nurse'])
CLINICAL_WRITE_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'doctor'])


def _resolve_encounter(obj):
    if hasattr(obj, 'patient') and hasattr(obj, 'doctor') and hasattr(obj, 'status'):
        return obj
    return getattr(obj, 'encounter', None)


def can_view_encounter(user, encounter) -> bool:
    if not user or not user.is_authenticated or encounter is None:
        return False

    role = getattr(user, 'role', '')
    if role in FULL_CLINICAL_ACCESS_ROLES:
        return True

    if role == 'doctor':
        staff = getattr(user, 'staff_profile', None)
        return bool(staff and encounter.doctor_id == staff.id)

    if role == 'patient':
        patient_profile = getattr(user, 'patient_profile', None)
        return bool(patient_profile and encounter.patient_id == patient_profile.id)

    return False


class IsAssignedDoctor(permissions.BasePermission):
    """
    Allows clinical access to scoped users:
    - admin/staff_head/nurse: full clinical access
    - assigned doctor: access to assigned encounter records
    - patient: read-only access to own encounter records
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        encounter = _resolve_encounter(obj)

        if request.method in permissions.SAFE_METHODS:
            return can_view_encounter(request.user, encounter)

        role = getattr(request.user, 'role', '')
        if role not in CLINICAL_WRITE_ROLES:
            return False

        if role in FULL_CLINICAL_ACCESS_ROLES:
            return True

        staff = getattr(request.user, 'staff_profile', None)
        return bool(staff and encounter and encounter.doctor_id == staff.id)


class CanManageMedicalHistory(permissions.BasePermission):
    """
    Role-aware access for medical history.
    Patients may read only their own records; clinical staff may write.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', '')
        if request.method in permissions.SAFE_METHODS:
            return role in (*FULL_CLINICAL_ACCESS_ROLES, 'doctor', 'patient')

        return role in CLINICAL_WRITE_ROLES

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', '')

        if request.method in permissions.SAFE_METHODS:
            if role in FULL_CLINICAL_ACCESS_ROLES:
                return True
            if role == 'doctor':
                staff = getattr(request.user, 'staff_profile', None)
                if not staff:
                    return False
                return obj.patient.appointment_set.filter(doctor=staff).exists() or obj.patient.encounter_set.filter(doctor=staff).exists()
            if role == 'patient':
                patient_profile = getattr(request.user, 'patient_profile', None)
                return bool(patient_profile and obj.patient_id == patient_profile.id)
            return False

        return role in CLINICAL_WRITE_ROLES