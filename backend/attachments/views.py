import mimetypes

from django.db.models import Q
from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser

from audit.utils import log_action
from .models import FileAttachment
from .serializers import FileAttachmentSerializer
from .selectors import get_all_attachments
from .permissions import CanAccessAttachment


class FileAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = FileAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessAttachment]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['file_type', 'patient', 'encounter']
    search_fields = ['description']
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        qs = get_all_attachments()
        user = self.request.user

        if not user or not user.is_authenticated:
            return qs.none()

        role = getattr(user, 'role', '')
        if user.is_superuser or role in ('admin', 'staff_head', 'nurse'):
            return qs

        patient = getattr(user, 'patient_profile', None)
        if role == 'patient' and patient:
            return qs.filter(patient=patient)

        staff = getattr(user, 'staff_profile', None)
        if not staff:
            return qs.none()

        if role == 'doctor':
            return qs.filter(
                Q(uploaded_by=staff) |
                Q(encounter__doctor=staff) |
                Q(patient__appointment__doctor=staff) |
                Q(patient__encounter__doctor=staff)
            ).distinct()

        if role in ('lab_tech', 'pharmacist'):
            return qs.filter(uploaded_by=staff)

        return qs.none()

    def perform_create(self, serializer):
        staff_profile = getattr(self.request.user, 'staff_profile', None)
        if not staff_profile:
            raise PermissionDenied('Only staff users can upload attachments.')

        attachment = serializer.save(uploaded_by=staff_profile)
        log_action(
            self.request.user,
            'UPLOAD',
            'FileAttachment',
            attachment.id,
            str(attachment),
            f"Uploaded attachment for patient {attachment.patient_id} and encounter {attachment.encounter_id}.",
            self.request,
        )

    def perform_destroy(self, instance):
        attachment_repr = str(instance)
        attachment_id = instance.id
        patient_id = instance.patient_id
        encounter_id = instance.encounter_id
        instance.delete()
        log_action(
            self.request.user,
            'DELETE',
            'FileAttachment',
            attachment_id,
            attachment_repr,
            f"Deleted attachment for patient {patient_id} and encounter {encounter_id}.",
            self.request,
        )

    @action(detail=True, methods=['GET'], url_path='download')
    def download(self, request, pk=None):
        attachment = self.get_object()
        log_action(
            request.user,
            'DOWNLOAD',
            'FileAttachment',
            attachment.id,
            str(attachment),
            f"Downloaded attachment for patient {attachment.patient_id} and encounter {attachment.encounter_id}.",
            request,
        )
        content_type, _ = mimetypes.guess_type(attachment.file.name)
        return FileResponse(
            attachment.file.open('rb'),
            as_attachment=True,
            filename=attachment.file.name.rsplit('/', 1)[-1],
            content_type=content_type or 'application/octet-stream',
        )
