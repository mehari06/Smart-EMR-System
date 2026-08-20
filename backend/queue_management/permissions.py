"""
Queue Management Module — Permissions
"""

from rest_framework import permissions


class CanManageQueue(permissions.BasePermission):
    """Nurses, Doctors, and Admins can manage queue."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_roles = ['admin', 'doctor', 'nurse', 'receptionist']
        return request.user.role in allowed_roles


class CanTriage(permissions.BasePermission):
    """Only Nurses and Admins can perform triage."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_roles = ['admin', 'nurse']
        return request.user.role in allowed_roles


class CanAssignDoctor(permissions.BasePermission):
    """Nurses, Admins, and Receptionists can assign doctors."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed_roles = ['admin', 'nurse', 'receptionist']
        return request.user.role in allowed_roles
