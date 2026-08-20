from django.db import models
from .constants import TRIAGE_LEVEL_CHOICES


class Appointment(models.Model):
    STATUS_SCHEDULED = 'S'
    STATUS_CHECKED_IN = 'I'
    STATUS_TRIAGED    = 'G' 
    STATUS_COMPLETED = 'C'
    STATUS_CANCELLED = 'X'
    STATUS_NO_SHOW = 'N'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED,  'Scheduled'),
        (STATUS_CHECKED_IN, 'Checked In'),
        (STATUS_TRIAGED,    'Triaged'),
        (STATUS_COMPLETED,  'Completed'),
        (STATUS_CANCELLED,  'Cancelled'),
        (STATUS_NO_SHOW,    'No Show'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.PROTECT, null=True, blank=True)
    doctor = models.ForeignKey('core.Staff', on_delete=models.PROTECT,
                               related_name='appointments_as_doctor', null=True, blank=True)
    department = models.ForeignKey(
        'core.Department', on_delete=models.PROTECT, null=True, blank=True)
     # ── NEW Triage Fields ─────────────────────────────
    triage_nurse = models.ForeignKey(
        'core.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triaged_appointments',
        help_text="Nurse assigned for initial triage"
    )
    triage_level = models.PositiveSmallIntegerField(
        choices=TRIAGE_LEVEL_CHOICES,
        null=True,
        blank=True,
        help_text="ESI Triage Level (1-5)"
    )
    chief_complaint = models.CharField(max_length=255, blank=True)
    triage_notes = models.TextField(blank=True)
    triaged_at = models.DateTimeField(null=True, blank=True)
    pain_score = models.PositiveSmallIntegerField(null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    heart_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    systolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    diastolic_bp = models.PositiveSmallIntegerField(null=True, blank=True)
    oxygen_saturation = models.PositiveSmallIntegerField(null=True, blank=True)
    respiratory_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    scheduled_at = models.DateTimeField()
    reason = models.CharField(max_length=255)
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        patient = self.patient or 'Unassigned patient'
        doctor = self.doctor or 'Unassigned doctor'
        scheduled = self.scheduled_at.strftime('%Y-%m-%d %H:%M') if self.scheduled_at else 'unscheduled'
        return f'{patient} - {doctor} @ {scheduled}'

    class Meta:
        ordering = ['scheduled_at']
        # ── Database Indexes for Performance ───────────────
        indexes = [
            models.Index(fields=['scheduled_at']),
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['triage_nurse', 'status']),
            models.Index(fields=['doctor', 'scheduled_at']),
            models.Index(fields=['department']),
        ]

        # ── Custom Permissions ──────────────────────────────
        # Use case: Doctor is unavailable on a given day.
        # Who can postpone or transfer the appointment?
        permissions = [
            ('can_reschedule_appointment',
             'Can reschedule an appointment to a new date/time'),

            ('can_transfer_appointment',
             'Can transfer an appointment to a different doctor'),

            ('can_cancel_appointment',
             'Can cancel a scheduled appointment'),

            ('can_assign_doctor',
             'Can assign or reassign a doctor to an appointment'),

            ('can_view_all_appointments',
             'Can view appointments of all patients across departments'),

            ('can_checkin_patient',
             'Can mark a patient as checked-in for their appointment'),
            ('can_triage_patient', 'Can perform triage assessment'),
        ]
