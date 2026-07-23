from django.db import models
from django.conf import settings


class Patient(models.Model):
    GENDER_MALE   = 'M'
    GENDER_FEMALE = 'F'

    GENDER_CHOICES = [
        (GENDER_MALE,   'Male'),
        (GENDER_FEMALE, 'Female'),
    ]

    BLOOD_A_POSITIVE  = 'A+'
    BLOOD_A_NEGATIVE  = 'A-'
    BLOOD_B_POSITIVE  = 'B+'
    BLOOD_B_NEGATIVE  = 'B-'
    BLOOD_AB_POSITIVE = 'AB+'
    BLOOD_AB_NEGATIVE = 'AB-'
    BLOOD_O_POSITIVE  = 'O+'
    BLOOD_O_NEGATIVE  = 'O-'

    BLOOD_GROUP_CHOICES = [
        (BLOOD_A_POSITIVE,  'A+'),
        (BLOOD_A_NEGATIVE,  'A-'),
        (BLOOD_B_POSITIVE,  'B+'),
        (BLOOD_B_NEGATIVE,  'B-'),
        (BLOOD_AB_POSITIVE, 'AB+'),
        (BLOOD_AB_NEGATIVE, 'AB-'),
        (BLOOD_O_POSITIVE,  'O+'),
        (BLOOD_O_NEGATIVE,  'O-'),
    ]

    # ── Profile link to custom User ─────────────────────────
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='patient_profile',
    )

    patient_number          = models.CharField(max_length=20, unique=True)
    date_of_birth           = models.DateField()
    gender                  = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group             = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    phone                   = models.CharField(max_length=20)
    address                 = models.TextField()
    emergency_contact_name  = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    profile_photo           = models.ImageField(upload_to='patients/', blank=True, null=True)
    is_active               = models.BooleanField(default=True)
    registered_at           = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.patient_number} — {self.user.get_full_name()}'

    class Meta:
        ordering = ['patient_number']

#PATAIENT INTAKE
class Allergy(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering     = ['name']
        verbose_name_plural = 'Allergies'


class PatientAllergy(models.Model):
    SEVERITY_MILD     = 'M'
    SEVERITY_MODERATE = 'O'
    SEVERITY_SEVERE   = 'S'

    SEVERITY_CHOICES = [
        (SEVERITY_MILD,     'Mild'),
        (SEVERITY_MODERATE, 'Moderate'),
        (SEVERITY_SEVERE,   'Severe'),
    ]

    patient     = models.ForeignKey(Patient, on_delete=models.CASCADE)
    allergy     = models.ForeignKey(Allergy, on_delete=models.PROTECT)
    severity    = models.CharField(max_length=1, choices=SEVERITY_CHOICES)
    reaction    = models.CharField(max_length=255, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.patient} — {self.allergy} ({self.get_severity_display()})'

    class Meta:
        ordering     = ['patient']
        verbose_name = 'Patient Allergy'
        verbose_name_plural = 'Patient Allergies'
