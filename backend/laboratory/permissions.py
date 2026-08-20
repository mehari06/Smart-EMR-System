from rest_framework import permissions

FULL_LAB_READ_ROLES = frozenset(['admin', 'staff_head', 'nurse', 'lab_tech'])
LAB_ORDER_CREATE_ROLES = frozenset(['admin', 'staff_head', 'doctor', 'nurse'])
LAB_RESULT_ROLES = frozenset(['admin', 'staff_head', 'lab_tech'])


def can_view_lab_order(user, lab_order) -> bool:
    if not user or not user.is_authenticated or lab_order is None:
        return False

    role = getattr(user, 'role', '')
    if user.is_superuser or role in FULL_LAB_READ_ROLES:
        return True

    if role == 'patient':
        patient = getattr(user, 'patient_profile', None)
        return bool(patient and lab_order.patient_id == patient.id)

    if role == 'doctor':
        staff = getattr(user, 'staff_profile', None)
        return bool(staff and lab_order.encounter.doctor_id == staff.id)

    return False


class CanAccessLabOrder(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', '')
        if request.method in permissions.SAFE_METHODS:
            return role in (*FULL_LAB_READ_ROLES, 'doctor', 'patient')

        if view.action == 'create':
            return role in LAB_ORDER_CREATE_ROLES and hasattr(request.user, 'staff_profile')

        if view.action == 'receive_results':
            return role in LAB_RESULT_ROLES and hasattr(request.user, 'staff_profile')

        return role in ('admin', 'staff_head')

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return can_view_lab_order(request.user, obj)

        role = getattr(request.user, 'role', '')
        if request.user.is_superuser or role in ('admin', 'staff_head'):
            return True

        if view.action == 'receive_results':
            return role == 'lab_tech'

        staff = getattr(request.user, 'staff_profile', None)
        return bool(role in ('doctor', 'nurse') and staff and obj.encounter.doctor_id == staff.id)
