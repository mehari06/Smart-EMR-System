"""
Patient Management Module — Permissions

DRF permission classes specific to the patients module.
"""

from rest_framework import permissions


PATIENT_STAFF_ROLES = ('admin', 'staff_head', 'doctor', 'nurse', 'receptionist')
PATIENT_CREATE_ROLES = ('admin', 'staff_head', 'doctor', 'nurse', 'receptionist')


class CanCreatePatient(permissions.BasePermission):
    """Allows staff roles that register patients to create patient records."""

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', '') in PATIENT_CREATE_ROLES
        )


class CanAccessPatient(permissions.BasePermission):
    """
    Allows staff to access patient records according to queryset scoping.
    Allows patients to view/update only their own profile.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', '') in (*PATIENT_STAFF_ROLES, 'patient')

    def has_object_permission(self, request, view, obj) -> bool:
        role = getattr(request.user, 'role', '')

        if role in ('admin', 'staff_head'):
            return True

        if role in ('doctor', 'nurse', 'receptionist'):
            return request.method in permissions.SAFE_METHODS or request.method in ('PUT', 'PATCH')

        if role == 'patient':
            return obj.user_id == request.user.id and (
                request.method in permissions.SAFE_METHODS or request.method in ('PUT', 'PATCH')
            )

        return False




def can_access_patient_allergy_patient(user, patient, *, write=False) -> bool:
    if not user or not user.is_authenticated or patient is None:
        return False

    role = getattr(user, 'role', '')
    if user.is_superuser or role in ('admin', 'staff_head', 'nurse'):
        return True

    if role == 'patient':
        return not write and patient.user_id == user.id

    if role == 'doctor':
        staff = getattr(user, 'staff_profile', None)
        if not staff:
            return False
        return (
            patient.appointment_set.filter(doctor=staff).exists() or
            patient.encounter_set.filter(doctor=staff).exists()
        )

    return False


class CanAccessPatientAllergy(permissions.BasePermission):
    """Role-aware access to patient-specific allergy records."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', '')
        if request.method in permissions.SAFE_METHODS:
            return role in ('admin', 'staff_head', 'nurse', 'doctor', 'patient')

        return role in ('admin', 'staff_head', 'nurse', 'doctor')

    def has_object_permission(self, request, view, obj) -> bool:
        return can_access_patient_allergy_patient(
            request.user,
            obj.patient,
            write=request.method not in permissions.SAFE_METHODS,
        )

# Backward-compatible aliases for older imports.
CanManagePatients = CanAccessPatient
IsPatientOwner = CanAccessPatient