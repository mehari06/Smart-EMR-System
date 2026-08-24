"""
Clinical Module — Views
Exposes REST endpoints using ViewSets and connects to the Service/Selector layer.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import MedicalHistory, Encounter, VitalSign, Diagnosis, RadiologyTest, RadiologyOrder
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
    DiagnosisSerializer,
    RadiologyTestSerializer,
    RadiologyOrderSerializer,
    RadiologyOrderCreateSerializer,
)
from .services import (
    close_encounter,
    reopen_encounter,
    create_radiology_order,
    receive_radiology_results,
)
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page




def scope_encounter_queryset(qs, user):
    if not user or not user.is_authenticated:
        return qs.none()

    role = getattr(user, 'role', '')
    if role in ('admin', 'staff_head', 'nurse'):
        return qs

    if role == 'doctor' and hasattr(user, 'staff_profile'):
        return qs.filter(doctor=user.staff_profile)

    if role == 'patient' and hasattr(user, 'patient_profile'):
        return qs.filter(patient=user.patient_profile)

    return qs.none()


def scope_patient_queryset(qs, user):
    if not user or not user.is_authenticated:
        return qs.none()

    role = getattr(user, 'role', '')
    if role in ('admin', 'staff_head', 'nurse'):
        return qs

    if role == 'doctor' and hasattr(user, 'staff_profile'):
        staff = user.staff_profile
        return qs.filter(
            Q(patient__appointment__doctor=staff) | Q(patient__encounter__doctor=staff)
        ).distinct()

    if role == 'patient' and hasattr(user, 'patient_profile'):
        return qs.filter(patient=user.patient_profile)

    return qs.none()

def scope_encounter_related_queryset(qs, user):
    if not user or not user.is_authenticated:
        return qs.none()

    role = getattr(user, 'role', '')
    if role in ('admin', 'staff_head', 'nurse'):
        return qs

    if role == 'doctor' and hasattr(user, 'staff_profile'):
        return qs.filter(encounter__doctor=user.staff_profile)

    if role == 'patient' and hasattr(user, 'patient_profile'):
        return qs.filter(encounter__patient=user.patient_profile)

    return qs.none()

class MedicalHistoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Medical History, Family History, and Immunizations.
    """
    serializer_class = MedicalHistorySerializer
    permission_classes = [CanManageMedicalHistory]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'condition_type', 'status']

    def get_queryset(self):
        qs = MedicalHistory.objects.all().select_related('patient', 'recorded_by')
        qs = scope_patient_queryset(qs, self.request.user)

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        return qs


class EncounterViewSet(viewsets.ModelViewSet):
    """
    Manage Patient Encounters (Visits).
    """
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'doctor', 'status']

    def get_queryset(self):
        qs = (
            Encounter.objects
            .all()
            .select_related('patient', 'doctor', 'appointment')
            .prefetch_related('diagnoses', 'radiology_orders', 'prescriptions')
        )
        qs = scope_encounter_queryset(qs, self.request.user)

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return EncounterListSerializer
        elif self.action == 'create':
            return EncounterCreateSerializer
        elif self.action == 'close':
            return EncounterCloseSerializer
        return EncounterDetailSerializer

    def create(self, request, *args, **kwargs):
        """
        Delegate entirely to EncounterCreateSerializer.create(), which calls
        start_encounter(). Do NOT call start_encounter() here as well —
        that would create two encounters.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        encounter = serializer.save()
        return Response(
            EncounterDetailSerializer(
                encounter, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAssignedDoctor])
    def close(self, request, pk=None):
        """Custom endpoint to close an encounter and record final notes."""
        encounter = self.get_object()

        if encounter.status != Encounter.STATUS_OPEN:
            return Response(
                {'detail': 'Only open encounters can be closed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EncounterCloseSerializer(
            encounter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        closed_encounter = close_encounter(
            encounter=encounter,
            clinical_notes=serializer.validated_data.get('clinical_notes'),
            discharge_summary=serializer.validated_data.get(
                'discharge_summary'),
            user=request.user,
        )
        return Response(
            EncounterDetailSerializer(closed_encounter, context={
                                      'request': request}).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['POST'], permission_classes=[permissions.IsAuthenticated, IsAssignedDoctor])
    def reopen(self, request, pk=None):
        """Reopen a completed encounter so more notes/vitals can be added."""
        encounter = self.get_object()
        reopened = reopen_encounter(encounter=encounter, user=request.user)
        return Response(
            EncounterDetailSerializer(
                reopened, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class VitalSignViewSet(viewsets.ModelViewSet):
    """
    Manage Vital Signs for an encounter.
    Delegates creation to VitalSignSerializer.create() → record_vitals() service.
    """
    serializer_class = VitalSignSerializer
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter']

    def get_queryset(self):
        qs = VitalSign.objects.all().select_related('encounter', 'recorded_by')
        return scope_encounter_related_queryset(qs, self.request.user)


class DiagnosisViewSet(viewsets.ModelViewSet):
    """
    Manage Diagnoses for an encounter.
    Delegates creation to DiagnosisSerializer.create() → add_diagnosis() service.
    """
    serializer_class = DiagnosisSerializer
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter']

    def get_queryset(self):
        qs = Diagnosis.objects.all().select_related('encounter', 'diagnosed_by')
        return scope_encounter_related_queryset(qs, self.request.user)


class RadiologyTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RadiologyTest.objects.filter(is_active=True)
    serializer_class = RadiologyTestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(86400))  # Cache 24 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class RadiologyOrderViewSet(viewsets.ModelViewSet):
    """
    Manage Radiology Orders.
    Creating an order sends it to RIS (mock).
    Receive results via receive_results action.
    """
    serializer_class = RadiologyOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsAssignedDoctor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter', 'status', 'patient', 'ordered_by']

    def get_queryset(self):
        qs = RadiologyOrder.objects.all().select_related('encounter', 'test', 'ordered_by')
        qs = scope_encounter_related_queryset(qs, self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return RadiologyOrderCreateSerializer
        return RadiologyOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data.copy()

        # ── Convert user ID to staff ID ─────────────────
        from core.models import Staff
        ordered_by_value = data.get('ordered_by')
        if ordered_by_value and isinstance(ordered_by_value, int):
            try:
                staff = Staff.objects.get(user_id=ordered_by_value)
                data['ordered_by'] = staff
            except Staff.DoesNotExist:
                pass

        radiology_order = create_radiology_order(**data)
        return Response(
            RadiologyOrderSerializer(radiology_order, context={
                                     'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['POST'], url_path='receive_results')
    def receive_results(self, request, pk=None):
        """Simulate receiving results from the RIS."""
        radiology_order = self.get_object()
        result_file = request.FILES.get('result_file')
        result_text = request.data.get('result_text', '')
        ris_order_id = request.data.get('ris_order_id', '')

        updated = receive_radiology_results(
            radiology_order=radiology_order,
            result_file=result_file,
            result_text=result_text,
            ris_order_id=ris_order_id
        )
        return Response(
            RadiologyOrderSerializer(
                updated, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['GET'], url_path='download')
    def download_result(self, request, pk=None):
        """Download radiology result as PDF."""
        radiology_order = self.get_object()
        
        from django.http import HttpResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from io import BytesIO
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []
        
        elements.append(Paragraph(f"Radiology Report", styles['Title']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"<b>Test:</b> {radiology_order.test.name}", styles['Normal']))
        elements.append(Paragraph(f"<b>Patient:</b> {radiology_order.patient.user.get_full_name()}", styles['Normal']))
        elements.append(Paragraph(f"<b>Ordered:</b> {radiology_order.ordered_at.strftime('%Y-%m-%d')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        if radiology_order.result_text:
            for line in radiology_order.result_text.split('\n'):
                elements.append(Paragraph(line, styles['Normal']))
        
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="radiology_result_{radiology_order.id}.pdf"'
        return response