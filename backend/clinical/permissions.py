"""
Clinical Module — Permissions
Security rules for accessing clinical records and encounters.
"""

from rest_framework import permissions


class IsAssignedDoctor(permissions.BasePermission):
    """
    Object-level permission to ensure only the doctor assigned to an 
    encounter can view or modify its clinical notes, vitals, and diagnoses.
    """
    
    def has_permission(self, request, view):
        # Must be logged in
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # We need to find the Encounter. 
        # If the object IS an encounter, we check obj.doctor.user
        # If the object is a VitalSign or Diagnosis, we check obj.encounter.doctor.user
        
        # Check if the user is a superuser or administrator, they get a bypass
        if hasattr(request.user, 'role') and request.user.role in ['admin', 'management']:
            return True

        doctor = getattr(obj, 'doctor', None)
        
        if not doctor:
            # If the object is VitalSign/Diagnosis, it has an `encounter` attribute
            encounter = getattr(obj, 'encounter', None)
            if encounter:
                doctor = encounter.doctor

        if doctor and hasattr(doctor, 'user'):
            return doctor.user == request.user

        return False


class CanManageMedicalHistory(permissions.BasePermission):
    """
    Doctors, Nurses, and Admins can manage medical history.
    Patients cannot modify their own history (only view).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True # Read access is handled by querysets filtering in views
            
        return getattr(request.user, 'role', '') in ['doctor', 'nurse', 'admin', 'management']
