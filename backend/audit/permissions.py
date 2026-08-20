from rest_framework import permissions


class IsAuditAdmin(permissions.BasePermission):
    """Only platform admins and staff heads can view audit logs."""

    def has_permission(self, request, view):
        user = request.user
        role = getattr(user, 'role', '')
        return bool(
            user and
            user.is_authenticated and
            (user.is_superuser or role in ('admin', 'staff_head'))
        )


# Backward-compatible alias for older imports.
IsAdminUser = IsAuditAdmin
