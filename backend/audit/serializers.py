from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_full_name',
            'action', 'model_name', 'object_id', 'object_repr',
            'details', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['timestamp']
