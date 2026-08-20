"""
Patient Management Module — Views

Thin ViewSet. All logic is delegated to services and selectors.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .filters import PatientFilter
from .permissions import CanAccessPatient, CanAccessPatientAllergy, CanCreatePatient, can_access_patient_allergy_patient
from .selectors import get_patient_list, get_patient_by_id
from .models import Patient, Allergy, PatientAllergy
from .serializers import (
    PatientListSerializer,
    PatientDetailSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
    AllergySerializer,
    PatientAllergySerializer,
)
from .services import deactivate_patient
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache



def scope_patient_allergy_queryset(qs, user):
    if not user or not user.is_authenticated:
        return qs.none()

    role = getattr(user, 'role', '')
    if user.is_superuser or role in ('admin', 'staff_head', 'nurse'):
        return qs

    if role == 'patient' and hasattr(user, 'patient_profile'):
        return qs.filter(patient=user.patient_profile)

    if role == 'doctor' and hasattr(user, 'staff_profile'):
        staff = user.staff_profile
        return qs.filter(
            Q(patient__appointment__doctor=staff) |
            Q(patient__encounter__doctor=staff)
        ).distinct()

    return qs.none()

class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient CRUD ViewSet.

    list:   GET  /api/patients/          — paginated, filterable, searchable
    create: POST /api/patients/          — register new patient
    retrieve: GET /api/patients/{id}/   — full patient detail
    update: PUT  /api/patients/{id}/    — full update
    partial: PATCH /api/patients/{id}/  — partial update
    destroy: DELETE /api/patients/{id}/ — soft delete (deactivate)
    """

    # ── Query ────────────────────────────────────────────────
    def get_queryset(self):
        qs = get_patient_list()
        user = self.request.user

        if not user.is_authenticated:
            return qs.none()

        role = getattr(user, 'role', '')

        if role in ('admin', 'staff_head', 'nurse', 'receptionist'):
            return qs

        if role == 'patient':
            return qs.filter(user=user)

        if role == 'doctor' and hasattr(user, 'staff_profile'):
            staff = user.staff_profile
            return qs.filter(
                Q(appointment__doctor=staff) | Q(encounter__doctor=staff)
            ).distinct()

        return qs.none()

    # ── Permissions ──────────────────────────────────────────
    def get_permissions(self):
        if self.action == "create":
           return [permissions.IsAuthenticated(), CanCreatePatient()]
        if self.action in ["retrieve", "update", "partial_update"]:
           return [permissions.IsAuthenticated(), CanAccessPatient()]
        if self.action == "destroy":
           from core.permissions import IsAdministrator
           return [permissions.IsAuthenticated(), IsAdministrator()]
        return [permissions.IsAuthenticated(), CanAccessPatient()]
    # ── Serializers ──────────────────────────────────────────
    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        if self.action == "retrieve":
            return PatientDetailSerializer
        if self.action == "create":
            return PatientCreateSerializer
        if self.action in ["update", "partial_update"]:
            return PatientUpdateSerializer
        return PatientDetailSerializer
    def list(self, request, *args, **kwargs):
        search = request.query_params.get('search', '')
        
        if search:
            cache_key = f'patient_search_{search.lower().strip()}'
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, 300)  # 5 minutes
            return response
        
        return super().list(request, *args, **kwargs)


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        response_serializer = PatientDetailSerializer(patient, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # ── Filtering / Searching / Ordering ─────────────────────
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PatientFilter
    search_fields = [
        "patient_number",
        "user__first_name",
        "user__last_name",
        "phone",
        "user__email",
    ]
    ordering_fields = [
        "registered_at",
        "updated_at",
        "user__first_name",
        "user__last_name",
    ]
    ordering = ["-registered_at"]

    # ── Custom Actions ────────────────────────────────────────
    def perform_create(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Soft delete — deactivates patient instead of hard deletion."""
        patient = self.get_object()
        deactivate_patient(patient=patient)
        return Response(
            {"detail": "Patient has been deactivated successfully."},
            status=status.HTTP_200_OK,
        )


class AllergyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['category']
    
    @method_decorator(cache_page(86400))  # Cache 24 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class PatientAllergyViewSet(viewsets.ModelViewSet):
    """
    Manage Patient Allergies.
    """
    serializer_class = PatientAllergySerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessPatientAllergy]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'severity']

    def get_queryset(self):
        qs = PatientAllergy.objects.all().select_related('patient__user', 'allergy')
        qs = scope_patient_allergy_queryset(qs, self.request.user)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        patient = serializer.validated_data.get('patient')
        if not can_access_patient_allergy_patient(self.request.user, patient, write=True):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to update allergies for this patient.')
        serializer.save()

    def perform_update(self, serializer):
        patient = serializer.validated_data.get('patient') or serializer.instance.patient
        if not can_access_patient_allergy_patient(self.request.user, patient, write=True):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to update allergies for this patient.')
        serializer.save()
