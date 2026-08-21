from django.db import models
from django.conf import settings
from django.db.models.signals import pre_save
from django.dispatch import receiver
import uuid


class Patient(models.Model):
    GENDER_MALE = 'M'
    GENDER_FEMALE = 'F'

    GENDER_CHOICES = [
        (GENDER_MALE,   'Male'),
        (GENDER_FEMALE, 'Female'),
    ]

    BLOOD_A_POSITIVE = 'A+'
    BLOOD_A_NEGATIVE = 'A-'
    BLOOD_B_POSITIVE = 'B+'
    BLOOD_B_NEGATIVE = 'B-'
    BLOOD_AB_POSITIVE = 'AB+'
    BLOOD_AB_NEGATIVE = 'AB-'
    BLOOD_O_POSITIVE = 'O+'
    BLOOD_O_NEGATIVE = 'O-'

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

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='patient_profile',
    )

    patient_number = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(
        max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    profile_photo = models.ImageField(
        upload_to='patients/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.patient_number} — {self.user.get_full_name()}'

    class Meta:
        ordering = ['patient_number']


# ── Patient Intake ───────────────────────────────────────────────

class Allergy(models.Model):
    """Master allergen catalogue — searchable by name/category."""
    CATEGORY_DRUG = 'D'
    CATEGORY_FOOD = 'F'
    CATEGORY_ENVIRONMENT = 'E'
    CATEGORY_OTHER = 'O'

    CATEGORY_CHOICES = [
        (CATEGORY_DRUG,        'Drug'),
        (CATEGORY_FOOD,        'Food'),
        (CATEGORY_ENVIRONMENT, 'Environment'),
        (CATEGORY_OTHER,       'Other'),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=1, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Allergies'


class PatientAllergy(models.Model):
    """Records a specific patient's allergy, severity and reaction."""
    SEVERITY_MILD = 'M'
    SEVERITY_MODERATE = 'O'
    SEVERITY_SEVERE = 'S'

    SEVERITY_CHOICES = [
        (SEVERITY_MILD,     'Mild'),
        (SEVERITY_MODERATE, 'Moderate'),
        (SEVERITY_SEVERE,   'Severe'),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name='allergies_set')
    allergy = models.ForeignKey(Allergy, on_delete=models.PROTECT)
    severity = models.CharField(max_length=1, choices=SEVERITY_CHOICES)
    reaction = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.patient} — {self.allergy} ({self.get_severity_display()})'

    class Meta:
        ordering = ['patient']
        unique_together = [('patient', 'allergy')]
        verbose_name = 'Patient Allergy'
        verbose_name_plural = 'Patient Allergies'




@receiver(pre_save, sender=Patient)
def auto_generate_patient_number(sender, instance, **kwargs):
    if not instance.patient_number:
        # Use UUID for collision-resistant unique number
        unique_id = uuid.uuid4().hex[:8].upper()
        instance.patient_number = f"PAT-{unique_id}"
