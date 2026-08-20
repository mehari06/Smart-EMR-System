from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from audit.utils import log_action
from .models import Prescription
from .permissions import CanAccessPrescription
from .serializers import PrescriptionCreateSerializer, PrescriptionSerializer

from .services import create_prescription

class PrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [CanAccessPrescription]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'prescribed_at', 'encounter', 'prescribed_by']
    search_fields = [
        'encounter__patient__user__first_name',
        'encounter__patient__user__last_name',
        'encounter__patient__patient_number',
        'prescriptionitem__medicine__name',
    ]
    ordering_fields = ['prescribed_at', 'status']
    ordering = ['-prescribed_at']

    def get_queryset(self):
        qs = (
            Prescription.objects
            .select_related('encounter__patient__user', 'encounter__doctor__user', 'prescribed_by__user')
            .prefetch_related('prescriptionitem_set__medicine')
        )
        user = self.request.user

        if not user or not user.is_authenticated:
            return qs.none()

        role = getattr(user, 'role', '')
        if user.is_superuser or role in ('admin', 'staff_head', 'nurse', 'pharmacist'):
            return qs

        if role == 'doctor' and hasattr(user, 'staff_profile'):
            return qs.filter(encounter__doctor=user.staff_profile)

        if role == 'patient' and hasattr(user, 'patient_profile'):
            return qs.filter(encounter__patient=user.patient_profile)

        return qs.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def create(self, request, *args, **kwargs):
        staff_profile = getattr(request.user, 'staff_profile', None)
        if not staff_profile:
            raise PermissionDenied('Only staff users can prescribe medication.')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        encounter = data.get('encounter')

        if not encounter:
            raise PermissionDenied('Encounter is required for a prescription.')

        if getattr(request.user, 'role', '') == 'doctor' and encounter.doctor_id != staff_profile.id:
            raise PermissionDenied('Doctors can prescribe only for assigned encounters.')

        data['prescribed_by'] = staff_profile
        prescription = create_prescription(**data)
        log_action(
            request.user,
            'PRESCRIBE',
            'Prescription',
            prescription.id,
            str(prescription),
            f"Created prescription for encounter {prescription.encounter_id}.",
            request,
        )
        return Response(
            PrescriptionSerializer(prescription, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
