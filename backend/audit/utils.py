from .models import AuditLog


def log_action(user, action, model_name=None, object_id=None, object_repr=None, details=None, request=None):
    """
    Helper function to create audit log entries.
    """
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    # Handle None user safely
    audit_user = None
    if user is not None:
        audit_user = user if getattr(user, 'is_authenticated', False) else None

    AuditLog.objects.create(
        user=audit_user,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else '',
        object_repr=object_repr or '',
        details=details or '',
        ip_address=ip_address,
    )