"""
Tests for Audit module.
"""

import pytest
from django.utils import timezone

from audit.models import AuditLog
from audit.utils import log_action
from audit.serializers import AuditLogSerializer


@pytest.mark.django_db
class TestAuditLog:
    """Test audit logging."""
    
    def test_log_action_creates_record(self, admin_user):
        """Log an action."""
        log_action(
            user=admin_user,
            action='CREATE',
            model_name='Patient',
            object_id='1',
            object_repr='Test Patient',
            details='Created test patient',
        )
        
        log = AuditLog.objects.first()
        assert log is not None
        assert log.action == 'CREATE'
        assert log.model_name == 'Patient'
        assert log.user == admin_user
    
    def test_log_action_without_user(self):
        """Log action without user (system action)."""
        log_action(
            user=None,
            action='LOGIN',
            model_name='Auth',
            object_id='',
            object_repr='',
            details='Login attempt',
        )
        
        log = AuditLog.objects.first()
        assert log.user is None
    
    def test_log_action_with_request_ip(self, admin_user):
        """Log action with IP address."""
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.post('/test')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        
        log_action(
            user=admin_user,
            action='UPDATE',
            model_name='Patient',
            object_id='1',
            object_repr='Test',
            details='Updated',
            request=request,
        )
        
        log = AuditLog.objects.first()
        assert log.ip_address == '127.0.0.1'


@pytest.mark.django_db
class TestAuditLogSerializer:
    """Test audit log serializer."""
    
    def test_serialize_audit_log(self, admin_user):
        """Serialize an audit log entry."""
        log = AuditLog.objects.create(
            user=admin_user,
            action='EXPORT',
            model_name='Report',
            object_id='5',
            object_repr='Test Report',
            details='Exported report',
        )
        
        serializer = AuditLogSerializer(log)
        data = serializer.data
        
        assert data['action'] == 'EXPORT'
        assert data['model_name'] == 'Report'
        assert data['user_email'] == 'admin@test.com'
        assert data['user_full_name'] == 'Admin Test'


@pytest.mark.django_db
class TestAuditLogQuery:
    """Test audit log queries."""
    
    def test_get_logs_by_action(self, admin_user):
        """Filter logs by action."""
        log_action(admin_user, 'CREATE', 'Patient', '1', 'Test', 'Created')
        log_action(admin_user, 'DELETE', 'Patient', '2', 'Test2', 'Deleted')
        log_action(admin_user, 'CREATE', 'Appointment', '1', 'Test3', 'Created')
        
        create_logs = AuditLog.objects.filter(action='CREATE')
        assert create_logs.count() == 2
        
        delete_logs = AuditLog.objects.filter(action='DELETE')
        assert delete_logs.count() == 1
    
    def test_get_logs_by_user(self, admin_user, doctor_user):
        """Filter logs by user."""
        log_action(admin_user, 'LOGIN', 'Auth', '', '', 'Admin login')
        log_action(doctor_user, 'LOGIN', 'Auth', '', '', 'Doctor login')
        
        admin_logs = AuditLog.objects.filter(user=admin_user)
        assert admin_logs.count() == 1
        
        doctor_logs = AuditLog.objects.filter(user=doctor_user)
        assert doctor_logs.count() == 1
    
    def test_logs_ordered_by_newest(self, admin_user):
        """Logs are ordered newest first."""
        log_action(admin_user, 'LOGIN', 'Auth', '', '', 'First')
        log_action(admin_user, 'LOGOUT', 'Auth', '', '', 'Second')
        
        logs = AuditLog.objects.all()
        assert logs.first().action == 'LOGOUT'
        assert logs.last().action == 'LOGIN'