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

    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, null=True, blank=True)
    doctor = models.ForeignKey('core.Staff', on_delete=models.PROTECT, null=True, blank=True)
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
    recorded_by = models.ForeignKey('core.Staff', on_delete=models.PROTECT, null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Vitals - {self.encounter}"


class Diagnosis(models.Model):
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, null=True, blank=True)
    icd10_code = models.CharField(max_length=20)
    description = models.CharField(max_length=255)
    treatment_plan = models.TextField(blank=True)
    clinical_notes = models.TextField(blank=True)
    diagnosed_by = models.ForeignKey('core.Staff', on_delete=models.PROTECT, null=True, blank=True)
    diagnosed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.icd10_code} - {self.description}"

    class Meta:
        ordering = ['icd10_code']
        verbose_name_plural = 'Diagnoses'


# ============================================================
# MEDICAL HISTORY
# ============================================================

class MedicalHistory(models.Model):
    """
    Stores a patient's past medical conditions, surgeries,
    family history, and immunizations.
    """

    TYPE_CHRONIC        = 'CH'
    TYPE_ACUTE          = 'AC'
    TYPE_SURGICAL       = 'SU'
    TYPE_MENTAL         = 'MH'
    TYPE_FAMILY_HISTORY = 'FH'
    TYPE_IMMUNIZATION   = 'IM'
    TYPE_OTHER          = 'OT'

    TYPE_CHOICES = [
        (TYPE_CHRONIC,        'Chronic Disease'),
        (TYPE_ACUTE,          'Acute Illness'),
        (TYPE_SURGICAL,       'Surgical Procedure'),
        (TYPE_MENTAL,         'Mental Health'),
        (TYPE_FAMILY_HISTORY, 'Family History'),
        (TYPE_IMMUNIZATION,   'Immunization'),
        (TYPE_OTHER,          'Other'),
    ]

    STATUS_ACTIVE   = 'A'
    STATUS_RESOLVED = 'R'
    STATUS_MANAGED  = 'M'

    STATUS_CHOICES = [
        (STATUS_ACTIVE,   'Active'),
        (STATUS_RESOLVED, 'Resolved / Administered'),
        (STATUS_MANAGED,  'Managed / Controlled'),
    ]

    patient         = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='medical_history')
    condition_name  = models.CharField(max_length=255, help_text='Name of the disease, surgery, or vaccine')
    icd10_code      = models.CharField(max_length=10, blank=True, verbose_name='ICD-10 Code')
    condition_type  = models.CharField(max_length=2, choices=TYPE_CHOICES, default=TYPE_OTHER)
    status          = models.CharField(max_length=1, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    onset_date      = models.DateField(null=True, blank=True, help_text='Date of diagnosis, surgery, or administration')
    resolution_date = models.DateField(null=True, blank=True, help_text='Date resolved (if applicable)')
    notes           = models.TextField(blank=True, help_text='Details about family member, vaccine lot, etc.')
    recorded_by     = models.ForeignKey('core.Staff', on_delete=models.SET_NULL, null=True, blank=True)
    recorded_at     = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.patient} - {self.condition_name} ({self.get_condition_type_display()})'

    class Meta:
        ordering            = ['-recorded_at']
        verbose_name        = 'Medical History'
        verbose_name_plural = 'Medical Histories'

