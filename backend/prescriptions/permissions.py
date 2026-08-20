from rest_framework import permissions

FULL_PRESCRIPTION_READ_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'pharmacist'])
PRESCRIPTION_CREATE_ROLES = frozenset(['admin', 'staff_head', 'doctor'])
PRESCRIPTION_UPDATE_ROLES = frozenset(['admin', 'staff_head', 'doctor', 'pharmacist'])


def can_view_prescription(user, prescription) -> bool:
    if not user or not user.is_authenticated or prescription is None:
        return False

    role = getattr(user, 'role', '')
    if user.is_superuser or role in FULL_PRESCRIPTION_READ_ROLES:
        return True

    if role == 'patient':
        patient = getattr(user, 'patient_profile', None)
        return bool(patient and prescription.encounter.patient_id == patient.id)

    if role == 'doctor':
        staff = getattr(user, 'staff_profile', None)
        return bool(staff and prescription.encounter.doctor_id == staff.id)

    return False


class CanAccessPrescription(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', '')
        if request.method in permissions.SAFE_METHODS:
            return role in (*FULL_PRESCRIPTION_READ_ROLES, 'doctor', 'patient')

        if view.action == 'create':
            return role in PRESCRIPTION_CREATE_ROLES and hasattr(request.user, 'staff_profile')

        return role in PRESCRIPTION_UPDATE_ROLES and hasattr(request.user, 'staff_profile')

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return can_view_prescription(request.user, obj)

        role = getattr(request.user, 'role', '')
        if request.user.is_superuser or role in ('admin', 'staff_head', 'pharmacist'):
            return True

        staff = getattr(request.user, 'staff_profile', None)
        return bool(role == 'doctor' and staff and obj.encounter.doctor_id == staff.id)
