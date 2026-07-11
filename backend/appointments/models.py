from django.db import models


class Appointment(models.Model):
    STATUS_SCHEDULED  = 'S'
    STATUS_CHECKED_IN = 'I'
    STATUS_COMPLETED  = 'C'
    STATUS_CANCELLED  = 'X'
    STATUS_NO_SHOW    = 'N'

    STATUS_CHOICES = [
        (STATUS_SCHEDULED,  'Scheduled'),
        (STATUS_CHECKED_IN, 'Checked In'),
        (STATUS_COMPLETED,  'Completed'),
        (STATUS_CANCELLED,  'Cancelled'),
        (STATUS_NO_SHOW,    'No Show'),
    ]

    patient      = models.ForeignKey('patients.Patient', on_delete=models.PROTECT)
    doctor       = models.ForeignKey('core.Staff', on_delete=models.PROTECT, related_name='appointments_as_doctor')
    department   = models.ForeignKey('core.Department', on_delete=models.PROTECT)
    scheduled_at = models.DateTimeField()
    reason       = models.CharField(max_length=255)
    status       = models.CharField(max_length=1, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.patient} → Dr. {self.doctor} @ {self.scheduled_at:%Y-%m-%d %H:%M}'

    class Meta:
        ordering = ['scheduled_at']

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
        ]
