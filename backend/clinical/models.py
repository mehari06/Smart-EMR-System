from django.db import models


class Encounter(models.Model):
    STATUS_OPEN = 'O'
    STATUS_COMPLETED = 'C'
    STATUS_CANCELLED = 'X'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT)
    doctor = models.ForeignKey('core.Staff', on_delete=models.PROTECT)
    appointment = models.OneToOneField(
        'appointments.Appointment', on_delete=models.SET_NULL, null=True, blank=True)
    chief_complaint = models.TextField()
    clinical_notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default=STATUS_OPEN)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Encounter {self.id} - {self.patient}"

    class Meta:
        ordering = ['-started_at']
        permissions = [
            ('can_start_encounter',     'Can start a new clinical encounter'),
            ('can_complete_encounter',  'Can complete/close a clinical encounter'),
            ('can_view_any_encounter',  'Can view encounters of any patient'),
        ]


class VitalSign(models.Model):
    encounter = models.OneToOneField(Encounter, on_delete=models.CASCADE)
    temperature = models.DecimalField(max_digits=4, decimal_places=1)
    systolic_pressure = models.PositiveSmallIntegerField()
    diastolic_pressure = models.PositiveSmallIntegerField()
    pulse_rate = models.PositiveSmallIntegerField()
    respiratory_rate = models.PositiveSmallIntegerField()
    oxygen_saturation = models.PositiveSmallIntegerField()
    height = models.DecimalField(max_digits=5, decimal_places=2)
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    recorded_by = models.ForeignKey('core.Staff', on_delete=models.PROTECT)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Vitals - {self.encounter}"


class Diagnosis(models.Model):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE)
    icd10_code = models.CharField(max_length=20)
    description = models.CharField(max_length=255)
    treatment_plan = models.TextField(blank=True)
    clinical_notes = models.TextField(blank=True)
    diagnosed_by = models.ForeignKey('core.Staff', on_delete=models.PROTECT)
    diagnosed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.icd10_code} - {self.description}"

    class Meta:
        ordering = ['icd10_code']
        verbose_name_plural = 'Diagnoses'
