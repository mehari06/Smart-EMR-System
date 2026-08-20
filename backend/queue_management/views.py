"""
Queue Management Module — Views
REST API endpoints for queue operations.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import PatientQueue
from .serializers import (
    PatientQueueListSerializer,
    PatientQueueDetailSerializer,
    TriageAssessmentSerializer,
    AssignDoctorSerializer,
    QueueCreateSerializer,
    MarkLeftSerializer,
    TransferQueueSerializer,
)
from .services import (
    add_to_queue,
    start_triage,
    complete_triage,
    assign_doctor,
    start_consultation,
    complete_visit,
    patient_left,
    transfer_patient,
)
from .selectors import (
    get_active_queue,
    get_queue_by_id,
    get_doctor_queue,
    get_queue_stats,
)
from .permissions import CanManageQueue, CanTriage, CanAssignDoctor
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


class PatientQueueViewSet(viewsets.ModelViewSet):
    """
    Full CRUD + custom actions for Queue Management.

    Standard endpoints:
      GET    /api/queue/                  → Active queue dashboard
      POST   /api/queue/                  → Add patient to queue
      GET    /api/queue/{id}/             → Queue entry detail

    Custom actions:
      POST   /api/queue/{id}/start_triage/    → Begin triage
      POST   /api/queue/{id}/complete_triage/ → Complete triage assessment
      POST   /api/queue/{id}/assign_doctor/   → Assign doctor
      POST   /api/queue/{id}/start_consultation/ → Begin consultation
      POST   /api/queue/{id}/complete/        → Complete visit
      POST   /api/queue/{id}/mark_left/       → Patient left
      POST   /api/queue/{id}/transfer/        → Transfer patient
      GET    /api/queue/stats/                → Queue statistics
      GET    /api/queue/my_queue/             → Doctor's queue
    """

    permission_classes = [permissions.IsAuthenticated, CanManageQueue]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'patient__patient_number',
        'chief_complaint',
    ]
    ordering_fields = ['triage_level',
                       'arrival_time', 'estimated_wait_minutes']
    ordering = ['triage_level', 'arrival_time']

    def get_queryset(self):
        """Return active queue by default, or filter by query params."""
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            return get_doctor_queue(doctor_id=int(doctor_id))
        return get_active_queue()

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientQueueListSerializer
        if self.action in ['start_triage', 'complete_triage']:
            return TriageAssessmentSerializer
        if self.action == 'assign_doctor':
            return AssignDoctorSerializer
        if self.action == 'mark_left':
            return MarkLeftSerializer
        if self.action == 'transfer':
            return TransferQueueSerializer
        if self.action == 'create':
            return QueueCreateSerializer
        return PatientQueueDetailSerializer

    # ── CREATE: Add to Queue ─────────────────────────────────

    def create(self, request, *args, **kwargs):
        """Add patient to queue (walk-in or from appointment)."""
        serializer = QueueCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from patients.selectors import get_patient_by_id

        patient = get_patient_by_id(
            patient_id=serializer.validated_data['patient_id']
        )

        appointment_id = serializer.validated_data.get('appointment_id')
        appointment = None
        if appointment_id:
            from appointments.selectors import get_appointment_by_id
            appointment = get_appointment_by_id(appointment_id=appointment_id)

        queue_entry = add_to_queue(
            patient=patient,
            appointment=appointment,
            chief_complaint=serializer.validated_data.get(
                'chief_complaint', ''),
            user=request.user
        )

        return Response(
            PatientQueueDetailSerializer(
                queue_entry, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    # ── TRIAGE ACTIONS ──────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='start-triage',
            permission_classes=[permissions.IsAuthenticated, CanTriage])
    def start_triage(self, request, pk=None):
        """Nurse begins triage assessment."""
        queue_entry = self.get_object()
        updated = start_triage(queue_entry=queue_entry, user=request.user)
        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    @action(detail=True, methods=['POST'], url_path='complete-triage',
            permission_classes=[permissions.IsAuthenticated, CanTriage])
    def complete_triage(self, request, pk=None):
        """Nurse completes triage with vitals and acuity level."""
        queue_entry = self.get_object()
        serializer = TriageAssessmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = complete_triage(
            queue_entry=queue_entry,
            triage_data=serializer.validated_data,
            user=request.user
        )

        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    # ── DOCTOR ASSIGNMENT ───────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='assign-doctor',
            permission_classes=[permissions.IsAuthenticated, CanAssignDoctor])
    def assign_doctor(self, request, pk=None):
        """Assign doctor and room to patient."""
        queue_entry = self.get_object()
        serializer = AssignDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from core.models import Staff
        doctor = Staff.objects.get(pk=serializer.validated_data['doctor_id'])

        updated = assign_doctor(
            queue_entry=queue_entry,
            doctor=doctor,
            room=serializer.validated_data.get('room', ''),
            user=request.user
        )

        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    # ── CONSULTATION ────────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='start-consultation')
    def start_consultation(self, request, pk=None):
        """Mark patient as being seen by doctor."""
        queue_entry = self.get_object()
        updated = start_consultation(
            queue_entry=queue_entry, user=request.user)
        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    # ── COMPLETE / DISPOSITION ──────────────────────────────

    @action(detail=True, methods=['POST'], url_path='complete')
    def complete(self, request, pk=None):
        """Complete the patient visit."""
        queue_entry = self.get_object()
        disposition = request.data.get('disposition', '')
        updated = complete_visit(
            queue_entry=queue_entry,
            disposition=disposition,
            user=request.user
        )
        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    @action(detail=True, methods=['POST'], url_path='mark-left')
    def mark_left(self, request, pk=None):
        """Patient left without being seen."""
        queue_entry = self.get_object()
        serializer = MarkLeftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = patient_left(
            queue_entry=queue_entry,
            reason=serializer.validated_data['reason'],
            user=request.user
        )
        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    @action(detail=True, methods=['POST'], url_path='transfer')
    def transfer(self, request, pk=None):
        """Transfer patient to another department."""
        queue_entry = self.get_object()
        serializer = TransferQueueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = transfer_patient(
            queue_entry=queue_entry,
            transfer_to=serializer.validated_data['transfer_to'],
            reason=serializer.validated_data.get('reason', ''),
            user=request.user
        )
        return Response(
            PatientQueueDetailSerializer(
                updated, context={'request': request}).data
        )

    # ── DASHBOARD / STATS ───────────────────────────────────

    
    @method_decorator(cache_page(300))  # Cache 1 minute
    @action(detail=False, methods=['GET'], url_path='stats')
    def stats(self, request):
        """Queue dashboard statistics."""
        return Response(get_queue_stats())

    @action(detail=False, methods=['GET'], url_path='my-queue')
    def my_queue(self, request):
        """Doctor's assigned patients."""
        if hasattr(request.user, 'staff_profile'):
            doctor_id = request.user.staff_profile.id
            qs = get_doctor_queue(doctor_id=doctor_id)
            serializer = PatientQueueListSerializer(
                qs, many=True, context={'request': request})
            return Response(serializer.data)
        return Response([])
