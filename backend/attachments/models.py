from django.db import models
from clinical.models import Encounter
from patients.models import Patient
from core.models import Staff

class FileAttachment(models.Model):
    FILE_TYPES = [
        ('lab_report', 'Lab Report'),
        ('radiology_image', 'Radiology Image'),
        ('referral_letter', 'Referral Letter'),
        ('consent_form', 'Consent Form'),
        ('other', 'Other'),
    ]

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.PROTECT,
        related_name='attachments'
    )
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT)
    uploaded_by = models.ForeignKey(Staff, on_delete=models.PROTECT)
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_file_type_display()} - {self.encounter}"

    class Meta:
        ordering = ['-uploaded_at']