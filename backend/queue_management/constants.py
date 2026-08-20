"""
Queue Management Module — Constants
Triage levels, queue states, and configuration values.
"""

# ── Triage Acuity Levels (ESI Standard) ──────────────────────
TRIAGE_LEVEL_1 = 1  # Immediate - Life-threatening
TRIAGE_LEVEL_2 = 2  # Emergent - High risk, target < 15 min
TRIAGE_LEVEL_3 = 3  # Urgent - Multiple resources needed
TRIAGE_LEVEL_4 = 4  # Semi-urgent - One resource needed
TRIAGE_LEVEL_5 = 5  # Non-urgent - No resources needed

TRIAGE_LEVEL_CHOICES = [
    (TRIAGE_LEVEL_1, 'Level 1 - Immediate (Life-threatening)'),
    (TRIAGE_LEVEL_2, 'Level 2 - Emergent (< 15 min)'),
    (TRIAGE_LEVEL_3, 'Level 3 - Urgent (< 60 min)'),
    (TRIAGE_LEVEL_4, 'Level 4 - Semi-urgent (< 120 min)'),
    (TRIAGE_LEVEL_5, 'Level 5 - Non-urgent (< 240 min)'),
]

TRIAGE_TARGET_WAIT_MINUTES = {
    TRIAGE_LEVEL_1: 0,    # Immediate
    TRIAGE_LEVEL_2: 15,   # 15 minutes
    TRIAGE_LEVEL_3: 60,   # 1 hour
    TRIAGE_LEVEL_4: 120,  # 2 hours
    TRIAGE_LEVEL_5: 240,  # 4 hours
}

# ── Queue Statuses ───────────────────────────────────────────
QUEUE_WAITING = 'W'
QUEUE_IN_TRIAGE = 'T'
QUEUE_TRIAGED = 'G'
QUEUE_ASSIGNED = 'A'
QUEUE_IN_PROGRESS = 'P'
QUEUE_COMPLETED = 'C'
QUEUE_LEFT = 'L'
QUEUE_TRANSFERRED = 'F'

QUEUE_STATUS_CHOICES = [
    (QUEUE_WAITING, 'Waiting for Triage'),
    (QUEUE_IN_TRIAGE, 'In Triage'),
    (QUEUE_TRIAGED, 'Triaged - Waiting for Doctor'),
    (QUEUE_ASSIGNED, 'Assigned to Doctor'),
    (QUEUE_IN_PROGRESS, 'In Consultation'),
    (QUEUE_COMPLETED, 'Completed'),
    (QUEUE_LEFT, 'Left Without Being Seen'),
    (QUEUE_TRANSFERRED, 'Transferred'),
]

# ── Error Messages ───────────────────────────────────────────


class ErrorMessages:
    ALREADY_IN_QUEUE = "Patient is already in the active queue."
    PATIENT_NOT_IN_QUEUE = "Patient is not in the queue."
    TRIAGE_REQUIRED = "Patient must be triaged before assigning to doctor."
    INVALID_TRIAGE_LEVEL = "Triage level must be between 1 and 5."
    INVALID_STATUS_TRANSITION = "Invalid status transition from {} to {}."
    DOCTOR_UNAVAILABLE = "Selected doctor is not available."
