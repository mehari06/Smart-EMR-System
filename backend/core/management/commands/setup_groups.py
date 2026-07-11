"""
Management command: setup_groups

Creates default Groups and assigns permissions for the EMR system.

Usage:
    python manage.py setup_groups

Run this ONCE after migrations, before creating any users.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Create default EMR user groups and assign permissions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Setting up EMR Groups & Permissions ===\n'))

        self._create_administrators_group()
        self._create_doctors_group()
        self._create_nurses_group()
        self._create_pharmacists_group()
        self._create_lab_technicians_group()
        self._create_patients_group()

        self.stdout.write(self.style.SUCCESS('\n[OK] All groups created successfully!\n'))

    # ── Helper: get permission safely ─────────────────────
    def _get_perm(self, codename):
        try:
            return Permission.objects.get(codename=codename)
        except Permission.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'  [!] Permission not found: {codename}'))
            return None

    def _assign_perms(self, group, codenames):
        for codename in codenames:
            perm = self._get_perm(codename)
            if perm:
                group.permissions.add(perm)

    # ── 1. Administrators ──────────────────────────────────
    def _create_administrators_group(self):
        group, created = Group.objects.get_or_create(name='Administrators')
        # Administrators get all permissions
        all_perms = Permission.objects.all()
        group.permissions.set(all_perms)
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Administrators group {status} ({all_perms.count()} permissions)')

    # ── 2. Doctors ─────────────────────────────────────────
    def _create_doctors_group(self):
        group, created = Group.objects.get_or_create(name='Doctors')
        group.permissions.clear()
        self._assign_perms(group, [
            # Appointments
            'view_appointment',
            'can_reschedule_appointment',
            'can_transfer_appointment',
            'can_assign_doctor',
            'can_view_all_appointments',
            # Encounters
            'add_encounter',
            'change_encounter',
            'view_encounter',
            'can_start_encounter',
            'can_complete_encounter',
            # Vital Signs
            'view_vitalsign',
            # Diagnosis
            'add_diagnosis',
            'change_diagnosis',
            'view_diagnosis',
            # Prescriptions
            'add_prescription',
            'change_prescription',
            'view_prescription',
            'can_prescribe',
            # Lab Orders
            'add_laborder',
            'view_laborder',
            'can_order_lab_test',
            # Patients (view only)
            'view_patient',
        ])
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Doctors group {status}')

    # ── 3. Nurses ──────────────────────────────────────────
    def _create_nurses_group(self):
        group, created = Group.objects.get_or_create(name='Nurses')
        group.permissions.clear()
        self._assign_perms(group, [
            # Appointments
            'view_appointment',
            'can_checkin_patient',
            # Vital Signs — nurses record vitals
            'add_vitalsign',
            'change_vitalsign',
            'view_vitalsign',
            # Encounters (view + assist)
            'view_encounter',
            'change_encounter',
            # Patients
            'view_patient',
            'change_patient',
        ])
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Nurses group {status}')

    # ── 4. Pharmacists ─────────────────────────────────────
    def _create_pharmacists_group(self):
        group, created = Group.objects.get_or_create(name='Pharmacists')
        group.permissions.clear()
        self._assign_perms(group, [
            'view_prescription',
            'change_prescription',     # Update status to Dispensed
            'can_dispense',
            'view_medicine',
            'view_patient',
        ])
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Pharmacists group {status}')

    # ── 5. Lab Technicians ─────────────────────────────────
    def _create_lab_technicians_group(self):
        group, created = Group.objects.get_or_create(name='Lab Technicians')
        group.permissions.clear()
        self._assign_perms(group, [
            'view_laborder',
            'change_laborder',
            'can_upload_lab_result',
            'view_patient',
        ])
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Lab Technicians group {status}')

    # ── 6. Patients ────────────────────────────────────────
    def _create_patients_group(self):
        group, created = Group.objects.get_or_create(name='Patients')
        group.permissions.clear()
        self._assign_perms(group, [
            'view_appointment',
            'view_prescription',
        ])
        status = 'created' if created else 'updated'
        self.stdout.write(f'  [OK] Patients group {status}')
