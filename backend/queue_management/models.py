from django.db import models
from django.conf import settings
from .constants import (
    TRIAGE_LEVEL_CHOICES, QUEUE_STATUS_CHOICES,
    QUEUE_WAITING, TRIAGE_LEVEL_5
)


class PatientQueue(models.Model):
    """
    Emergency Department / Clinic Queue with Triage Priority.

    Patients are sorted by triage acuity FIRST, then arrival time.
    Higher acuity patients are seen before lower acuity regardless of arrival.
    """

    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='queue_entries'
    )
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_entry'
    )

    # ── Triage Information ─────────────────────────────────
    triage_level = models.PositiveSmallIntegerField(
        choices=TRIAGE_LEVEL_CHOICES,
        null=True,
        blank=True,
        help_text="ESI Triage Acuity Level"
    )
    chief_complaint = models.CharField(max_length=255, blank=True)
    triage_notes = models.TextField(blank=True)

    # ── Triage Vital Signs ─────────────────────────────────
    pain_score = models.PositiveSmallIntegerField(null=True, blank=True)
    temperature = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True)
    heart_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    systolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    diastolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    oxygen_saturation = models.PositiveSmallIntegerField(null=True, blank=True)
    respiratory_rate = models.PositiveSmallIntegerField(null=True, blank=True)

    # ── Queue State ────────────────────────────────────────
    current_status = models.CharField(
        max_length=1,
        choices=QUEUE_STATUS_CHOICES,
        default=QUEUE_WAITING
    )
    is_fast_track = models.BooleanField(
        default=False,
        help_text="Minor injuries/illnesses that can be seen quickly"
    )

    # ── Assignment ─────────────────────────────────────────
    assigned_doctor = models.ForeignKey(
        'core.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_queue_patients'
    )
    assigned_room = models.CharField(max_length=20, blank=True)

    # ── Staff Tracking ─────────────────────────────────────
    triaged_by = models.ForeignKey(
        'core.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triaged_patients'
    )

    # ── Timestamps ─────────────────────────────────────────
    arrival_time = models.DateTimeField(auto_now_add=True)
    triage_started_at = models.DateTimeField(null=True, blank=True)
    triage_completed_at = models.DateTimeField(null=True, blank=True)
    doctor_assigned_at = models.DateTimeField(null=True, blank=True)
    consultation_started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Wait Times ─────────────────────────────────────────
    estimated_wait_minutes = models.PositiveSmallIntegerField(
        null=True, blank=True)
    actual_wait_minutes = models.PositiveSmallIntegerField(
        null=True, blank=True)

    # ── Disposition ────────────────────────────────────────
    disposition = models.CharField(max_length=100, blank=True)
    left_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['triage_level', 'arrival_time']
        indexes = [
            models.Index(fields=['triage_level', 'arrival_time']),
            models.Index(fields=['current_status', 'triage_level']),
            models.Index(fields=['assigned_doctor', 'current_status']),
            models.Index(fields=['patient', '-arrival_time']),
        ]
        permissions = [
            ('can_triage_patient', 'Can perform triage assessment'),
            ('can_assign_doctor', 'Can assign patient to a doctor'),
            ('can_manage_queue', 'Can manage the entire queue'),
            ('can_view_queue_dashboard', 'Can view the queue dashboard'),
        ]
        verbose_name = 'Patient Queue'
        verbose_name_plural = 'Patient Queues'

    def __str__(self):
        return f"{self.patient} - {self.get_triage_level_display() or 'Not Triaged'} - {self.get_current_status_display()}"

    @property
    def is_triaged(self):
        return self.triage_level is not None

    @property
    def is_emergency(self):
        return self.triage_level in [1, 2]

    @property
    def wait_time_so_far(self):
        """Calculate minutes since arrival."""
        from django.utils import timezone
        if self.completed_at:
            return None
        delta = timezone.now() - self.arrival_time
        return int(delta.total_seconds() / 60)

    @property
    def is_waiting_too_long(self):
        """Check if patient has waited beyond target time."""
        from .constants import TRIAGE_TARGET_WAIT_MINUTES
        if not self.triage_level:
            return False
        target = TRIAGE_TARGET_WAIT_MINUTES.get(self.triage_level, 120)
        return self.wait_time_so_far and self.wait_time_so_far > target


class QueueEvent(models.Model):
    """
    Audit trail for queue status changes.
    Tracks every state transition for analytics and compliance.
    """
    queue_entry = models.ForeignKey(
        PatientQueue,
        on_delete=models.CASCADE,
        related_name='events'
        
    )
    from_status = models.CharField(
        max_length=1, choices=QUEUE_STATUS_CHOICES, null=True, blank=True)
    to_status = models.CharField(max_length=1, choices=QUEUE_STATUS_CHOICES)
    changed_by = models.ForeignKey(
        'core.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Queue Event'
        verbose_name_plural = 'Queue Events'

    def __str__(self):
        return f"Queue #{self.queue_entry_id}: {self.from_status} → {self.to_status}"
