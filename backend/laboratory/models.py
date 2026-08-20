from django.db import models

# Create your models here.
from django.db import models
from clinical.models import Encounter
from patients.models import Patient
from core.models import Staff

class LabTest(models.Model):
    """Master list of available lab tests (synced from LMS)."""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        ordering = ['name']


class LabOrder(models.Model):
    STATUS_PENDING    = 'P'
    STATUS_SENT       = 'S'   # Sent to LMS
    STATUS_RESULTS_IN = 'R'   # Results received from LMS
    STATUS_CANCELLED  = 'X'

    STATUS_CHOICES = [
        (STATUS_PENDING,    'Pending'),
        (STATUS_SENT,       'Sent to Lab'),
        (STATUS_RESULTS_IN, 'Results Received'),
        (STATUS_CANCELLED,  'Cancelled'),
    ]

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name='lab_orders'
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    ordered_by = models.ForeignKey(Staff, on_delete=models.PROTECT, related_name='lab_orders_ordered')
    test = models.ForeignKey(LabTest, on_delete=models.PROTECT)
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default=STATUS_PENDING)
    clinical_notes = models.TextField(blank=True)
    ordered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── LMS Integration Fields ──────────────────────────────────────────
    lms_order_id = models.CharField(max_length=100, blank=True, help_text="ID from the LMS")
    result_file = models.FileField(upload_to='lab_results/', blank=True, null=True)
    result_text = models.TextField(blank=True, help_text="Structured result text from LMS")
    result_received_at = models.DateTimeField(null=True, blank=True)
     # ADD THESE FIELDS after result_received_at
    verified_by = models.ForeignKey(
        'core.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_lab_orders',
        help_text="Physician who verified the results"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"LabOrder #{self.id} - {self.test.name} for {self.patient}"

    class Meta:
        ordering = ['-ordered_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['encounter', 'ordered_at']),
            models.Index(fields=['status', 'ordered_at']),
            models.Index(fields=['ordered_by', 'ordered_at']),
        ]
