"""
Appointments Module — Views
REST API ViewSet for all Appointment operations.

Endpoints:
  GET    /api/appointments/                         → List all appointments
  POST   /api/appointments/                         → Schedule new appointment
  GET    /api/appointments/{id}/                    → View appointment detail
  PATCH  /api/appointments/{id}/                    → Update appointment
  DELETE /api/appointments/{id}/                    → Delete appointment
  POST   /api/appointments/{id}/reschedule/         → Reschedule to new time
  POST   /api/appointments/{id}/cancel/             → Cancel appointment
  POST   /api/appointments/{id}/assign_doctor/      → Assign/reassign doctor
  POST   /api/appointments/{id}/checkin/            → Mark patient as checked in
  GET    /api/appointments/today/                   → Today's appointment list
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from audit.utils import log_action
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import AppointmentFilter
from .serializers import (
    AppointmentListSerializer,
    AppointmentDetailSerializer,
    AppointmentCreateSerializer,
    AppointmentRescheduleSerializer,
    AppointmentCancelSerializer,
    AssignDoctorSerializer,
    AppointmentCheckInSerializer,
    AppointmentTriageSerializer,
)
from .services import (
    schedule_appointment,
    reschedule_appointment,
    cancel_appointment,
    assign_doctor,
    checkin_patient,
    triage_appointment,
)
from .selectors import get_all_appointments
from .permissions import CanAccessAppointment


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Full CRUD + custom actions for Appointment management.
    """
    permission_classes = [permissions.IsAuthenticated, CanAccessAppointment]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AppointmentFilter
    search_fields = [
        'patient__user__first_name',
        'patient__user__last_name',
        'patient__patient_number',
        'doctor__user__first_name',
        'reason',
    ]
    ordering_fields = ['scheduled_at', 'created_at', 'status']
    ordering = ['scheduled_at']

    def get_queryset(self):
        qs = get_all_appointments()
        user = self.request.user

        if not user or not user.is_authenticated:
            return qs.none()

        role = getattr(user, 'role', '')
        
        # Check if doctor filter is in query params
        doctor_param = self.request.query_params.get('doctor')
        patient_param = self.request.query_params.get('patient')
        
        if user.is_superuser or role in ('admin', 'staff_head', 'nurse', 'receptionist'):
            # For admin/nurse/receptionist, apply filters if provided
            if doctor_param:
                qs = qs.filter(doctor_id=doctor_param)
            if patient_param:
                qs = qs.filter(patient_id=patient_param)
            return qs

        if role == 'doctor' and hasattr(user, 'staff_profile'):
            # Doctors always see their own appointments
            return qs.filter(doctor=user.staff_profile)

        if role == 'patient' and hasattr(user, 'patient_profile'):
            # Patients always see their own appointments
            return qs.filter(patient=user.patient_profile)

        return qs.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return AppointmentListSerializer
        if self.action == 'create':
            return AppointmentCreateSerializer
        if self.action == 'triage':
            return AppointmentTriageSerializer
        if self.action == 'reschedule':
            return AppointmentRescheduleSerializer
        if self.action == 'cancel':
            return AppointmentCancelSerializer
        if self.action == 'assign_doctor':
            return AssignDoctorSerializer
        if self.action == 'checkin':
            return AppointmentCheckInSerializer
        return AppointmentDetailSerializer

    # ── Standard Create (Schedule) ──────────────────────────────────────

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = schedule_appointment(**serializer.validated_data)
        log_action(
            request.user, 'CREATE', 'Appointment', appointment.id, str(appointment),
            f'Created appointment for patient {appointment.patient_id}.', request
        )
        return Response(
            AppointmentDetailSerializer(appointment).data,
            status=status.HTTP_201_CREATED
        )

    # ── Custom Action: Reschedule ───────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        """Reschedule an appointment to a new date and time."""
        appointment = self.get_object()
        serializer = AppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = reschedule_appointment(
                appointment=appointment,
                scheduled_at=serializer.validated_data['scheduled_at'],
                notes=serializer.validated_data.get('notes'),
            )
            log_action(
                request.user, 'UPDATE', 'Appointment', updated.id, str(updated),
                'Rescheduled appointment.', request
            )
            return Response(AppointmentDetailSerializer(updated).data)
        except ValidationError as e:
            return Response({'detail': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Custom Action: Cancel ───────────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Cancel an appointment with an optional reason."""
        appointment = self.get_object()
        serializer = AppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = cancel_appointment(
                appointment=appointment,
                notes=serializer.validated_data.get('notes'),
            )
            log_action(
                request.user, 'UPDATE', 'Appointment', updated.id, str(updated),
                'Cancelled appointment.', request
            )
            return Response(AppointmentDetailSerializer(updated).data)
        except ValidationError as e:
            return Response({'detail': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Custom Action: Assign Doctor ────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='assign_doctor')
    def assign_doctor(self, request, pk=None):
        """Assign or reassign a doctor to this appointment."""
        appointment = self.get_object()
        serializer = AssignDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = assign_doctor(
                appointment=appointment,
                doctor=serializer.validated_data['doctor'],
                notes=serializer.validated_data.get('notes'),
            )
            log_action(
                request.user, 'UPDATE', 'Appointment', updated.id, str(updated),
                f'Assigned doctor {updated.doctor_id} to appointment.', request
            )
            return Response(AppointmentDetailSerializer(updated).data)
        except ValidationError as e:
            return Response({'detail': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Custom Action: Check-In ─────────────────────────────────────────

    @action(detail=True, methods=['POST'], url_path='checkin')
    def checkin(self, request, pk=None):
        """Mark the patient as physically checked in to the hospital."""
        appointment = self.get_object()
        try:
            updated = checkin_patient(appointment=appointment)
            log_action(
                request.user, 'UPDATE', 'Appointment', updated.id, str(updated),
                'Checked in patient for appointment.', request
            )
            return Response(AppointmentDetailSerializer(updated).data)
        except ValidationError as e:
            return Response({'detail': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)

    # ── Custom Action: Today's Appointments ────────────────────────────

    @action(detail=False, methods=['GET'], url_path='today')
    def today(self, request):
        """Return all appointments scheduled for today."""
        qs = self.get_queryset().filter(scheduled_at__date=timezone.localdate())
        serializer = AppointmentListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'], url_path='triage')
    def triage(self, request, pk=None):
        """Nurse performs triage: records complaint, vitals, assigns doctor."""
        appointment = self.get_object()
        serializer = AppointmentTriageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = triage_appointment(
                appointment=appointment,
                triage_data=serializer.validated_data,
                user=request.user
            )
            log_action(
                request.user, 'RECORD_VITALS', 'Appointment', updated.id, str(updated),
                f'Triaged appointment at level {updated.triage_level}.', request
            )
            return Response(
                AppointmentDetailSerializer(updated).data,
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'detail': str(e.message)},
                status=status.HTTP_400_BAD_REQUEST
            )
