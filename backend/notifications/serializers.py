from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message',
            'priority', 'priority_display', 'is_read', 'read_at',
            'created_at', 'link',
        ]
        read_only_fields = ['id', 'created_at', 'read_at']