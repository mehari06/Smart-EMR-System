from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog
from .serializers import AuditLogSerializer
from .permissions import IsAdminUser  # We'll create this next


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only view for audit logs. Only accessible by admin users.
    """
    queryset = AuditLog.objects.all().select_related('user').order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'model_name', 'user__email']
    search_fields = ['action', 'details', 'model_name', 'user__email']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
