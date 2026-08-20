from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification model."""
    
    TYPE_APPOINTMENT_REMINDER = 'appointment_reminder'
    TYPE_LAB_RESULT = 'lab_result'
    TYPE_DRUG_REMINDER = 'drug_reminder'
    TYPE_PASSWORD_RESET = 'password_reset'
    TYPE_ACCOUNT_INVITATION = 'account_invitation'
    TYPE_SCHEDULE_DIGEST = 'schedule_digest'
    TYPE_NO_SHOW = 'no_show'
    TYPE_COMPLIANCE = 'compliance'
    TYPE_GENERAL = 'general'
    
    TYPE_CHOICES = [
        (TYPE_APPOINTMENT_REMINDER, 'Appointment Reminder'),
        (TYPE_LAB_RESULT, 'Lab Result Ready'),
        (TYPE_DRUG_REMINDER, 'Drug Reminder'),
        (TYPE_PASSWORD_RESET, 'Password Reset'),
        (TYPE_ACCOUNT_INVITATION, 'Account Invitation'),
        (TYPE_SCHEDULE_DIGEST, 'Schedule Digest'),
        (TYPE_NO_SHOW, 'No-Show Alert'),
        (TYPE_COMPLIANCE, 'Compliance Report'),
        (TYPE_GENERAL, 'General'),
    ]
    
    PRIORITY_LOW = 'low'
    PRIORITY_NORMAL = 'normal'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'
    
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Low'),
        (PRIORITY_NORMAL, 'Normal'),
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_URGENT, 'Urgent'),
    ]
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_GENERAL)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default=PRIORITY_NORMAL)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.recipient} - {self.title}"
    
    def mark_as_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])