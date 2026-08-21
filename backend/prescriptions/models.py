from django.db import models

# Create your models here.


class Medicine(models.Model):
    name = models.CharField(max_length=255)
    strength = models.CharField(max_length=100)
    form = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.name} {self.strength}"

    class Meta:
        ordering = ['name']


class Prescription(models.Model):
    STATUS_ACTIVE = 'A'
    STATUS_DISPENSED = 'D'
    STATUS_CANCELLED = 'X'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_DISPENSED, 'Dispensed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    encounter = models.ForeignKey(
        'clinical.Encounter', on_delete=models.PROTECT,
        related_name='prescriptions')
    prescribed_by = models.ForeignKey('core.Staff', on_delete=models.PROTECT)
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    instructions = models.TextField(blank=True)
    prescribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Prescription {self.id} - {self.encounter.patient}"

    class Meta:
        ordering = ['-prescribed_at']
        permissions = [
            ('can_prescribe', 'Can create prescriptions for patients'),
            ('can_dispense',  'Can dispense/update prescription status'),
        ]
        indexes = [
            models.Index(fields=['encounter']),
            models.Index(fields=['status']),
            models.Index(fields=['prescribed_by', 'prescribed_at']),
        ]


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE)
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    quantity = models.PositiveSmallIntegerField()
    instructions = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.medicine} - {self.dosage}"
    class Meta:
        indexes = [
            models.Index(fields=['prescription']),
            models.Index(fields=['medicine']),
        ]
