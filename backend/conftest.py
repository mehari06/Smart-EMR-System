"""
Pytest configuration and shared fixtures for ALL modules.
"""

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

User = get_user_model()


# ── Basic Fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Returns an unauthenticated Django test client."""
    return Client()


# ── User Fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def admin_user(db):
    """Create and return an admin user."""
    user = User.objects.create_user(
        email='admin@test.com',
        password='Admin@123',
        first_name='Admin',
        last_name='Test',
        role='admin',
        is_active=True,
        is_verified=True,
    )
    return user


@pytest.fixture
def doctor_user(db):
    """Create and return a doctor user with Staff profile."""
    from core.models import Staff
    
    user = User.objects.create_user(
        email='doctor@test.com',
        password='Doctor@123',
        first_name='Sarah',
        last_name='Smith',
        role='doctor',
        is_active=True,
        is_verified=True,
    )
    
    staff = Staff.objects.create(
        user=user,
        staff_id='DOC-001',
        specialization='General Medicine',
    )
    return user


@pytest.fixture
def nurse_user(db):
    """Create and return a nurse user with Staff profile."""
    from core.models import Staff
    
    user = User.objects.create_user(
        email='nurse@test.com',
        password='Nurse@123',
        first_name='Emily',
        last_name='Jones',
        role='nurse',
        is_active=True,
        is_verified=True,
    )
    
    staff = Staff.objects.create(
        user=user,
        staff_id='NUR-001',
        specialization='General Nursing',
    )
    return user


@pytest.fixture
def receptionist_user(db):
    """Create and return a receptionist user with Staff profile."""
    from core.models import Staff
    
    user = User.objects.create_user(
        email='receptionist@test.com',
        password='Recept@123',
        first_name='John',
        last_name='Doe',
        role='receptionist',
        is_active=True,
        is_verified=True,
    )
    
    staff = Staff.objects.create(
        user=user,
        staff_id='REC-001',
    )
    return user


@pytest.fixture
def pharmacist_user(db):
    """Create and return a pharmacist user with Staff profile."""
    from core.models import Staff
    
    user = User.objects.create_user(
        email='pharmacist@test.com',
        password='Pharm@123',
        first_name='Mike',
        last_name='Brown',
        role='pharmacist',
        is_active=True,
        is_verified=True,
    )
    
    staff = Staff.objects.create(
        user=user,
        staff_id='PHA-001',
    )
    return user


@pytest.fixture
def lab_tech_user(db):
    """Create and return a lab tech user with Staff profile."""
    from core.models import Staff
    
    user = User.objects.create_user(
        email='labtech@test.com',
        password='Lab@123',
        first_name='David',
        last_name='Wilson',
        role='lab_tech',
        is_active=True,
        is_verified=True,
    )
    
    staff = Staff.objects.create(
        user=user,
        staff_id='LAB-001',
    )
    return user


@pytest.fixture
def patient_user(db):
    """Create and return a patient user with Patient profile."""
    from patients.models import Patient
    
    user = User.objects.create_user(
        email='patient@test.com',
        password='Patient@123',
        first_name='Michael',
        last_name='Brown',
        role='patient',
        is_active=True,
        is_verified=True,
    )
    
    patient = Patient.objects.create(
        user=user,
        patient_number='PAT-000001',
        date_of_birth='1990-01-01',
        gender='M',
        phone='0912345678',
        address='Test Address',
        emergency_contact_name='Emergency Contact',
        emergency_contact_phone='0999999999',
    )
    return user


# ── Authenticated Client Fixtures ───────────────────────────────────────

@pytest.fixture
def admin_client(api_client, admin_user):
    """Client authenticated as admin."""
    api_client.force_login(admin_user)
    return api_client


@pytest.fixture
def doctor_client(api_client, doctor_user):
    """Client authenticated as doctor."""
    api_client.force_login(doctor_user)
    return api_client


@pytest.fixture
def nurse_client(api_client, nurse_user):
    """Client authenticated as nurse."""
    api_client.force_login(nurse_user)
    return api_client


@pytest.fixture
def patient_client(api_client, patient_user):
    """Client authenticated as patient."""
    api_client.force_login(patient_user)
    return api_client


# ── Model Fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def organization(db):
    """Create and return an organization."""
    from core.models import Organization
    return Organization.objects.create(
        name='Test Hospital',
        address='Test Address',
        phone='0112345678',
        email='hospital@test.com',
    )


@pytest.fixture
def department(db, organization):
    """Create and return a department."""
    from core.models import Department
    return Department.objects.create(
        name='Cardiology',
        organization=organization,
        description='Heart department',
    )


@pytest.fixture
def patient(db, patient_user):
    """Return the patient profile for patient_user."""
    from patients.models import Patient
    return Patient.objects.get(user=patient_user)


@pytest.fixture
def doctor_staff(db, doctor_user, department):
    """Return the staff profile for doctor_user with department."""
    from core.models import Staff
    staff = Staff.objects.get(user=doctor_user)
    staff.department = department
    staff.save()
    return staff


@pytest.fixture
def allergy(db):
    """Create and return an allergy."""
    from patients.models import Allergy
    return Allergy.objects.create(
        name='Penicillin',
        category='D',
        description='Antibiotic allergy',
    )


@pytest.fixture
def appointment(db, patient, doctor_staff, department):
    """Create and return an appointment."""
    from appointments.models import Appointment
    return Appointment.objects.create(
        patient=patient,
        doctor=doctor_staff,
        department=department,
        scheduled_at=timezone.now() + timezone.timedelta(days=1),
        reason='Test appointment',
        status='S',
    )


@pytest.fixture
def encounter(db, patient, doctor_staff):
    """Create and return an encounter."""
    from clinical.models import Encounter
    return Encounter.objects.create(
        patient=patient,
        doctor=doctor_staff,
        chief_complaint='Test complaint',
        status='O',
    )


@pytest.fixture
def lab_test(db):
    """Create and return a lab test."""
    from laboratory.models import LabTest
    return LabTest.objects.create(
        name='Complete Blood Count',
        code='CBC',
        description='Blood test',
    )


@pytest.fixture
def medicine(db):
    """Create and return a medicine."""
    from prescriptions.models import Medicine
    return Medicine.objects.create(
        name='Amoxicillin',
        strength='500mg',
        form='Tablet',
    )