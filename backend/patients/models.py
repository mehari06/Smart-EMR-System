from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User


class Patient(models.Model):
    BLOOD_GROUPS = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    patient_number = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=[
                              ('M', 'Male'), ('F', 'Female')])
    blood_group = models.CharField(
        max_length=3, choices=BLOOD_GROUPS, blank=True)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=15)
    profile_photo = models.ImageField(
        upload_to='patients/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient_number} - {self.user.get_full_name()}"
