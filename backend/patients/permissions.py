"""
Patient Management Module — Permissions

DRF permission classes specific to the patients module.
"""

from rest_framework import permissions


class CanManagePatients(permissions.BasePermission):
    """
    Allows access to:
    - Administrators (full CRUD)
    - Doctors and Nurses (read + update, no delete)
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_roles = ("admin", "doctor", "nurse")
        return request.user.role in allowed_roles

    def has_object_permission(self, request, view, obj) -> bool:
        # Admin can do anything
        if request.user.is_admin_role:
            return True

        # Doctors and Nurses can read and update, but not delete
        if request.user.role in ("doctor", "nurse"):
            return request.method in permissions.SAFE_METHODS or request.method in ("PUT", "PATCH")

        return False


class IsPatientOwner(permissions.BasePermission):
    """
    Allows a patient to view and update only their own profile.
    """

    def has_object_permission(self, request, view, obj) -> bool:
        if request.user.is_admin_role:
            return True
        return obj.user == request.user
