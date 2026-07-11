"""
Patient Management Module — Views

Thin ViewSet. All logic is delegated to services and selectors.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .filters import PatientFilter
from .models import Patient
from .permissions import CanManagePatients, IsPatientOwner
from .selectors import get_patient_list, get_patient_by_id
from .serializers import (
    PatientListSerializer,
    PatientDetailSerializer,
    PatientCreateSerializer,
    PatientUpdateSerializer,
)
from .services import deactivate_patient


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
    queryset = get_patient_list()

    # ── Permissions ──────────────────────────────────────────
    def get_permissions(self):
        if self.action == "create":
            # Registration can be done by Admins or the patient themselves
            return [permissions.IsAuthenticated()]
        if self.action in ["retrieve", "update", "partial_update"]:
            return [permissions.IsAuthenticated(), IsPatientOwner()]
        if self.action == "destroy":
            from core.permissions import IsAdministrator
            return [permissions.IsAuthenticated(), IsAdministrator()]
        # list
        return [permissions.IsAuthenticated(), CanManagePatients()]

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

    # ── Filtering / Searching / Ordering ─────────────────────
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class  = PatientFilter
    search_fields    = [
        "patient_number",
        "user__first_name",
        "user__last_name",
        "phone",
        "user__email",
    ]
    ordering_fields  = [
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
