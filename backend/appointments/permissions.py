from rest_framework import permissions

FULL_APPOINTMENT_ACCESS_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'receptionist'])
APPOINTMENT_CREATE_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'receptionist'])
APPOINTMENT_ASSIGN_ROLES = frozenset(['admin', 'staff_head', 'receptionist'])
APPOINTMENT_CHECKIN_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'receptionist'])
APPOINTMENT_TRIAGE_ROLES = frozenset(['admin', 'staff_head', 'nurse'])


def can_view_appointment(user, appointment) -> bool:
    if not user or not user.is_authenticated or appointment is None:
        return False

    role = getattr(user, 'role', '')
    if user.is_superuser or role in FULL_APPOINTMENT_ACCESS_ROLES:
        return True

    if role == 'doctor':
        staff = getattr(user, 'staff_profile', None)
        return bool(staff and appointment.doctor_id == staff.id)

    if role == 'patient':
        patient = getattr(user, 'patient_profile', None)
        return bool(patient and appointment.patient_id == patient.id)

    return False


class CanAccessAppointment(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', '')
        action = getattr(view, 'action', '')

        if request.method in permissions.SAFE_METHODS:
            return role in (*FULL_APPOINTMENT_ACCESS_ROLES, 'doctor', 'patient')

        if action == 'create':
            return role in APPOINTMENT_CREATE_ROLES

        if action == 'assign_doctor':
            return role in APPOINTMENT_ASSIGN_ROLES

        if action == 'checkin':
            return role in APPOINTMENT_CHECKIN_ROLES

        if action == 'triage':
            return role in APPOINTMENT_TRIAGE_ROLES

        if action == 'destroy':
            return role in ('admin', 'staff_head')

        if action in ('reschedule', 'cancel'):
            return role in (*FULL_APPOINTMENT_ACCESS_ROLES, 'doctor')

        return role in FULL_APPOINTMENT_ACCESS_ROLES

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', '')
        action = getattr(view, 'action', '')

        if request.method in permissions.SAFE_METHODS:
            return can_view_appointment(request.user, obj)

        if request.user.is_superuser or role in ('admin', 'staff_head'):
            return True

        if action in ('assign_doctor', 'checkin', 'triage'):
            return role in {
                'assign_doctor': APPOINTMENT_ASSIGN_ROLES,
                'checkin': APPOINTMENT_CHECKIN_ROLES,
                'triage': APPOINTMENT_TRIAGE_ROLES,
            }[action]

        if action in ('reschedule', 'cancel'):
            if role in ('nurse', 'receptionist'):
                return True
            if role == 'doctor':
                staff = getattr(request.user, 'staff_profile', None)
                return bool(staff and obj.doctor_id == staff.id)

        return False
