"""
Clinical Module — Views
Exposes REST endpoints using ViewSets and connects to the Service/Selector layer.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from .models import MedicalHistory, Encounter, VitalSign, Diagnosis
from .permissions import IsAssignedDoctor, CanManageMedicalHistory
from .selectors import (
    get_patient_medical_history, 
    get_patient_encounters, 
    get_encounter_by_id
)
from .serializers import (
    MedicalHistorySerializer,
    EncounterListSerializer,
    EncounterDetailSerializer,
    EncounterCreateSerializer,
    EncounterCloseSerializer,
    VitalSignSerializer,
    DiagnosisSerializer
)


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Medical History, Family History, and Immunizations.
    """
    serializer_class = MedicalHistorySerializer
    permission_classes = [CanManageMedicalHistory]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'condition_type', 'status']

    def get_queryset(self):
        # Allow passing ?patient=ID to filter the history
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return get_patient_medical_history(patient_id=patient_id)
        
        # Default fallback (should ideally only be used by admins viewing everything)
        return MedicalHistory.objects.all().select_related('patient', 'recorded_by')


class EncounterViewSet(viewsets.ModelViewSet):
    """
    Manage Patient Encounters (Visits).
    """
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'doctor', 'status']

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return get_patient_encounters(patient_id=patient_id)
        
        return Encounter.objects.all().select_related('patient', 'doctor', 'appointment')

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterListSerializer
        elif self.action == 'create':
            return EncounterCreateSerializer
        elif self.action == 'close':
            return EncounterCloseSerializer
        return EncounterDetailSerializer

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAssignedDoctor])
    def close(self, request, pk=None):
        """Custom endpoint to close an encounter and record final notes."""
        encounter = self.get_object()
        serializer = self.get_serializer(encounter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        closed_encounter = serializer.save()
        
        # Return the fully updated detail view
        return Response(
            EncounterDetailSerializer(closed_encounter).data, 
            status=status.HTTP_200_OK
        )


class VitalSignViewSet(viewsets.ModelViewSet):
    """
    Manage Vital Signs for an encounter.
    """
    queryset = VitalSign.objects.all().select_related('encounter', 'recorded_by')
    serializer_class = VitalSignSerializer
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter']


class DiagnosisViewSet(viewsets.ModelViewSet):
    """
    Manage Diagnoses for an encounter.
    """
    queryset = Diagnosis.objects.all().select_related('encounter', 'diagnosed_by')
    serializer_class = DiagnosisSerializer
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter']
