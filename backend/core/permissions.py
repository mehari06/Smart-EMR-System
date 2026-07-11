from rest_framework import permissions

class IsAdministrator(permissions.BasePermission):
    """Allows access only to users with the 'admin' role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_doctor)

class IsNurse(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_nurse)

class IsDoctorOrNurse(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_doctor or request.user.is_nurse)
        )

class IsPatientRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_patient_role)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has a `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_role:
            return True
        # Check if the object has a user property and it matches request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
