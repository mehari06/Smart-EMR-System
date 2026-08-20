"""
Celery configuration for Smart EMR.
"""

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('smartemr')

# Load settings from Django settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all apps
app.autodiscover_tasks()

# ── Scheduled Tasks (Celery Beat) ──────────────────────────────────

app.conf.beat_schedule = {
    # Send appointment reminders every hour
    'send-appointment-reminders': {
        'task': 'notifications.tasks.send_appointment_reminders',
        'schedule': 3600.0,  # Every 1 hour
    },
    
    # Send daily schedule digest to doctors at 6 AM
    'send-daily-schedule-digest': {
        'task': 'notifications.tasks.send_daily_schedule_digest',
        'schedule': crontab(hour=6, minute=0),  # Every day at 6:00 AM
    },
    
    # Send medication reminders every 30 minutes
    'send-medication-reminders': {
        'task': 'notifications.tasks.send_medication_reminders',
        'schedule': 1800.0,  # Every 30 minutes
    },
    
    # Send weekly compliance report Monday at 7 AM
    'send-weekly-compliance-report': {
        'task': 'notifications.tasks.send_weekly_compliance_report',
        'schedule': crontab(hour=7, minute=0, day_of_week=1),  # Every Monday at 7:00 AM
    },
    
    # Check for no-shows every 30 minutes
    'check-no-shows': {
        'task': 'notifications.tasks.check_no_shows',
        'schedule': 1800.0,  # Every 30 minutes
    },
}