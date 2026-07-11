from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings


# ============================================================
# CUSTOM USER MANAGER
# ============================================================

class UserManager(BaseUserManager):
    """
    Custom manager that uses email as the unique identifier
    instead of username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# ============================================================
# CUSTOM USER MODEL  (AbstractUser)
# ============================================================

class User(AbstractUser):
    """
    Custom User model — uses EMAIL as the login identifier.
    Adds a ROLE field to distinguish staff types and patients.

    Why AbstractUser?
    - Keeps all built-in fields (is_active, is_staff, groups, permissions…)
    - We only add: email login + role + phone + is_verified
    - Avoids rewriting password hashing and permission logic from scratch
    """

    # ── Role Choices ───────────────────────────────────────
    ROLE_ADMIN       = 'admin'
    ROLE_DOCTOR      = 'doctor'
    ROLE_NURSE       = 'nurse'
    ROLE_PHARMACIST  = 'pharmacist'
    ROLE_LAB_TECH    = 'lab_tech'
    ROLE_PATIENT     = 'patient'

    ROLE_CHOICES = [
        (ROLE_ADMIN,      'Administrator'),
        (ROLE_DOCTOR,     'Doctor'),
        (ROLE_NURSE,      'Nurse'),
        (ROLE_PHARMACIST, 'Pharmacist'),
        (ROLE_LAB_TECH,   'Lab Technician'),
        (ROLE_PATIENT,    'Patient'),
    ]

    # ── Remove username — use email instead ────────────────
    username       = None
    email          = models.EmailField(unique=True, verbose_name='Email Address')

    # ── EMR-specific fields ────────────────────────────────
    role           = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone          = models.CharField(max_length=20, blank=True)
    is_verified    = models.BooleanField(default=False)

    # ── Tell Django to use email for authentication ────────
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = UserManager()

    # ── Convenience role-check properties ─────────────────
    @property
    def is_admin_role(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_doctor(self):
        return self.role == self.ROLE_DOCTOR

    @property
    def is_nurse(self):
        return self.role == self.ROLE_NURSE

    @property
    def is_pharmacist(self):
        return self.role == self.ROLE_PHARMACIST

    @property
    def is_lab_tech(self):
        return self.role == self.ROLE_LAB_TECH

    @property
    def is_patient_role(self):
        return self.role == self.ROLE_PATIENT

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'

    class Meta:
        ordering       = ['email']
        verbose_name   = 'User'
        verbose_name_plural = 'Users'


# ============================================================
# ORGANIZATION
# ============================================================

class Organization(models.Model):
    name       = models.CharField(max_length=255)
    address    = models.TextField()
    phone      = models.CharField(max_length=20)
    email      = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# ============================================================
# DEPARTMENT
# ============================================================

class Department(models.Model):
    name         = models.CharField(max_length=100)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    description  = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# ============================================================
# STAFF PROFILE  (extends User via OneToOneField)
# ============================================================

class Staff(models.Model):
    """
    Profile for all clinical and administrative staff.
    Linked 1-to-1 with the custom User model.

    NOTE: Role (doctor/nurse/etc.) lives on User.role.
          Staff holds domain-specific info: staff_id, department, specialization.
    """
    user           = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_profile',
    )
    staff_id       = models.CharField(max_length=20, unique=True)
    department     = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True
    )
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    is_active      = models.BooleanField(default=True)
    joined_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.staff_id} — {self.user.get_full_name()}'

    class Meta:
        ordering     = ['staff_id']
        verbose_name = 'Staff Profile'
