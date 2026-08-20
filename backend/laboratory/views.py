from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from audit.utils import log_action
from .models import LabTest, LabOrder
from .permissions import CanAccessLabOrder
from .serializers import LabOrderCreateSerializer, LabOrderSerializer, LabTestSerializer
from .services import create_lab_order, receive_lab_results
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


class LabTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(86400))  # Cache 24 hours
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class LabOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [CanAccessLabOrder]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'ordered_at', 'encounter', 'test']
    search_fields = [
        'encounter__patient__user__first_name',
        'encounter__patient__user__last_name',
        'patient__user__first_name',
        'test__name',
        'test__code',
    ]
    ordering_fields = ['ordered_at', 'status']
    ordering = ['-ordered_at']

    def get_queryset(self):
        qs = (
            LabOrder.objects
            .select_related('test', 'ordered_by__user', 'encounter__doctor__user', 'patient__user')
        )
        user = self.request.user

        if not user or not user.is_authenticated:
            return qs.none()

        role = getattr(user, 'role', '')
        if user.is_superuser or role in ('admin', 'staff_head', 'nurse', 'lab_tech'):
            return qs

        if role == 'doctor' and hasattr(user, 'staff_profile'):
            return qs.filter(encounter__doctor=user.staff_profile)

        if role == 'patient' and hasattr(user, 'patient_profile'):
            
            return qs.filter(
                patient=user.patient_profile,
                is_verified=True
            )

        return qs.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return LabOrderCreateSerializer
        return LabOrderSerializer

    def create(self, request, *args, **kwargs):
        staff_profile = getattr(request.user, 'staff_profile', None)
        if not staff_profile:
            raise PermissionDenied('Only staff users can order labs.')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        encounter = data.get('encounter')

        if not encounter:
            raise PermissionDenied('Encounter is required for a lab order.')

        role = getattr(request.user, 'role', '')
        if role == 'doctor' and encounter.doctor_id != staff_profile.id:
            raise PermissionDenied('Doctors can order labs only for assigned encounters.')

        data['patient'] = encounter.patient
        data['ordered_by'] = staff_profile
        lab_order = create_lab_order(**data)
        log_action(
            request.user,
            'ORDER_LAB',
            'LabOrder',
            lab_order.id,
            str(lab_order),
            f"Created lab order for encounter {lab_order.encounter_id}.",
            request,
        )
        return Response(
            LabOrderSerializer(lab_order, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['POST'], url_path='receive_results')
    def receive_results(self, request, pk=None):
        lab_order = self.get_object()
        result_file = request.FILES.get('result_file')
        result_text = request.data.get('result_text', '')

        updated = receive_lab_results(
            lab_order=lab_order,
            result_file=result_file,
            result_text=result_text,
            lms_order_id=request.data.get('lms_order_id', ''),
        )
        log_action(
            request.user,
            'RECEIVE_LAB_RESULT',
            'LabOrder',
            updated.id,
            str(updated),
            f"Received lab results for encounter {updated.encounter_id}.",
            request,
        )
        return Response(
            LabOrderSerializer(updated, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )
    @action(detail=True, methods=['POST'], url_path='verify')
    def verify_results(self, request, pk=None):
        """Physician verifies results before they are visible to patients."""
        lab_order = self.get_object()
        
        # Only doctors/admin can verify
        role = getattr(request.user, 'role', '')
        if role not in ['admin', 'doctor']:
            return Response(
                {'detail': 'Only physicians can verify lab results.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if this doctor is assigned to the encounter
        if role == 'doctor':
            staff = getattr(request.user, 'staff_profile', None)
            if staff and lab_order.encounter.doctor_id != staff.id:
                return Response(
                    {'detail': 'You can only verify results for your own patients.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        lab_order.verified_by = getattr(request.user, 'staff_profile', None)
        lab_order.verified_at = timezone.now()
        lab_order.is_verified = True
        lab_order.save(update_fields=['verified_by', 'verified_at', 'is_verified'])
        
        # Audit log
        from audit.utils import log_action
        log_action(
            request.user,
            'VERIFY_LAB_RESULT',
            'LabOrder',
            lab_order.id,
            str(lab_order),
            f"Verified lab results for patient {lab_order.patient_id}.",
            request,
        )
        
        return Response(
            LabOrderSerializer(lab_order, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
