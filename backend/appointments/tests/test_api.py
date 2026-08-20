"""
Integration tests for API endpoints.
Tests all major endpoints with role-based authentication.
"""

import pytest
import json
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestAuthAPI:
    """Test authentication endpoints."""
    
    def test_login_success(self, api_client, admin_user):
        """Login with correct credentials."""
        response = api_client.post(
            '/api/core/auth/login',
            data=json.dumps({
                'email': 'admin@test.com',
                'password': 'Admin@123',
            }),
            content_type='application/json',
        )
        
        assert response.status_code == 200
        assert 'access' in response.json()
        assert 'refresh' in response.json()
    
    def test_login_wrong_password(self, api_client, admin_user):
        """Login with wrong password fails."""
        response = api_client.post(
            '/api/core/auth/login',
            data=json.dumps({
                'email': 'admin@test.com',
                'password': 'WrongPassword',
            }),
            content_type='application/json',
        )
        
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, api_client):
        """Login with non-existent user fails."""
        response = api_client.post(
            '/api/core/auth/login',
            data=json.dumps({
                'email': 'nonexistent@test.com',
                'password': 'Test@123',
            }),
            content_type='application/json',
        )
        
        assert response.status_code == 401
    
    def test_get_current_user(self, admin_client):
        """Get current user profile."""
        response = admin_client.get('/api/core/auth/me')
        
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == 'admin@test.com'
        assert data['role'] == 'admin'


@pytest.mark.django_db
class TestPatientAPI:
    """Test patient endpoints."""
    
    def test_list_patients_admin(self, admin_client):
        """Admin can list all patients."""
        response = admin_client.get('/api/patients')
        
        assert response.status_code == 200
        assert 'count' in response.json()
        assert 'results' in response.json()
    
    def test_list_patients_unauthenticated(self, api_client):
        """Unauthenticated cannot access."""
        response = api_client.get('/api/patients')
        
        assert response.status_code in [401, 403]
    
    def test_search_patients(self, admin_client, patient):
        """Search patients."""
        response = admin_client.get('/api/patients?search=Michael')
        
        assert response.status_code == 200
        results = response.json().get('results', [])
        assert len(results) >= 1
    
    def test_patient_can_only_see_own_profile(self, api_client, patient_user):
        """Patient sees only own data."""
        api_client.force_login(patient_user)
        
        response = api_client.get('/api/patients')
        
        assert response.status_code == 200
        results = response.json().get('results', [])
        assert len(results) == 1


@pytest.mark.django_db
class TestAppointmentAPI:
    """Test appointment endpoints."""
    
    def test_list_appointments(self, admin_client):
        """List appointments."""
        response = admin_client.get('/api/appointments')
        
        assert response.status_code == 200
    
    def test_create_appointment_as_admin(self, admin_client, patient, doctor_staff, department):
        """Admin can create appointment."""
        data = {
            'patient': patient.id,
            'doctor': doctor_staff.id,
            'department': department.id,
            'scheduled_at': (timezone.now() + timedelta(days=1)).isoformat(),
            'reason': 'Test appointment',
        }
        
        response = admin_client.post(
            '/api/appointments',
            data=json.dumps(data),
            content_type='application/json',
        )
        
        assert response.status_code == 201
    
    def test_today_appointments(self, admin_client):
        """Get today's appointments."""
        response = admin_client.get('/api/appointments/today')
        
        assert response.status_code == 200


@pytest.mark.django_db
class TestQueueAPI:
    """Test queue endpoints."""
    
    def test_queue_stats(self, admin_client):
        """Get queue stats."""
        response = admin_client.get('/api/queue/stats')
        
        assert response.status_code == 200
        assert 'total_waiting' in response.json()
    
    def test_add_to_queue(self, admin_client, patient):
        """Add patient to queue."""
        data = {
            'patient_id': patient.id,
            'chief_complaint': 'Test complaint',
        }
        
        response = admin_client.post(
            '/api/queue',
            data=json.dumps(data),
            content_type='application/json',
        )
        
        assert response.status_code == 201


@pytest.mark.django_db
class TestClinicalAPI:
    """Test clinical endpoints."""
    
    def test_list_encounters(self, admin_client):
        """List encounters."""
        response = admin_client.get('/api/clinical/encounters')
        
        assert response.status_code == 200
    
    def test_list_diagnoses(self, admin_client):
        """List diagnoses."""
        response = admin_client.get('/api/clinical/diagnoses')
        
        assert response.status_code == 200


@pytest.mark.django_db
class TestLaboratoryAPI:
    """Test laboratory endpoints."""
    
    def test_list_lab_tests(self, admin_client):
        """List lab tests."""
        response = admin_client.get('/api/laboratory/tests')
        
        assert response.status_code == 200
    
    def test_list_lab_orders(self, admin_client):
        """List lab orders."""
        response = admin_client.get('/api/laboratory/orders')
        
        assert response.status_code == 200


@pytest.mark.django_db
class TestDepartmentAPI:
    """Test department endpoints."""
    
    def test_list_departments(self, admin_client):
        """List departments."""
        response = admin_client.get('/api/core/departments')
        
        assert response.status_code == 200
    
    def test_create_department_as_admin(self, admin_client, organization):
        """Admin can create department."""
        data = {
            'name': 'New Department',
            'organization': organization.id,
            'description': 'Test department',
        }
        
        response = admin_client.post(
            '/api/core/departments',
            data=json.dumps(data),
            content_type='application/json',
        )
        
        assert response.status_code == 201


@pytest.mark.django_db
class TestAuditAPI:
    """Test audit endpoints."""
    
    def test_list_audit_logs_as_admin(self, admin_client):
        """Admin can view audit logs."""
        response = admin_client.get('/api/audit/')
        
        assert response.status_code == 200


@pytest.mark.django_db
class TestNotificationsAPI:
    """Test notification endpoints."""
    
    def test_list_notifications(self, admin_client):
        """List notifications."""
        response = admin_client.get('/api/notifications')
        
        assert response.status_code == 200
    
    def test_unread_count(self, admin_client):
        """Get unread count."""
        response = admin_client.get('/api/notifications/unread-count')
        
        assert response.status_code == 200
        assert 'count' in response.json()