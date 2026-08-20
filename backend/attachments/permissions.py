from rest_framework import permissions

FULL_ATTACHMENT_ACCESS_ROLES = frozenset(['admin', 'staff_head', 'nurse'])
ATTACHMENT_CREATE_ROLES = frozenset(['admin', 'staff_head', 'doctor', 'nurse', 'lab_tech'])


def _staff_profile(user):
    return getattr(user, 'staff_profile', None)


def _patient_profile(user):
    return getattr(user, 'patient_profile', None)


def can_view_attachment(user, attachment) -> bool:
    if not user or not user.is_authenticated or attachment is None:
        return False

    role = getattr(user, 'role', '')
    if user.is_superuser or role in FULL_ATTACHMENT_ACCESS_ROLES:
        return True

    patient = _patient_profile(user)
    if role == 'patient' and patient:
        return attachment.patient_id == patient.id

    staff = _staff_profile(user)
    if not staff:
        return False

    if attachment.uploaded_by_id == staff.id:
        return True

    if role == 'doctor':
        if attachment.encounter_id and attachment.encounter.doctor_id == staff.id:
            return True
        return attachment.patient.appointment_set.filter(doctor=staff).exists()

    return False


class CanAccessAttachment(permissions.BasePermission):
    """
    Role-aware access for clinical attachments.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        role = getattr(request.user, 'role', '')
        return bool(_staff_profile(request.user) and role in ATTACHMENT_CREATE_ROLES)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return can_view_attachment(request.user, obj)

        role = getattr(request.user, 'role', '')
        staff = _staff_profile(request.user)
        return bool(
            request.user.is_superuser or
            role in ('admin', 'staff_head') or
            (staff and obj.uploaded_by_id == staff.id)
        )


# Backward-compatible alias for older imports.
IsAdminOrUploader = CanAccessAttachment
