"""
Clinical Module — Services
Handles all business logic and state mutations for medical records.
"""
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from django.conf import settings

from .models import MedicalHistory, Encounter, VitalSign, Diagnosis

# ── Medical History ─────────────────────────────────────────────────────


def add_medical_history(*, patient, data: dict, recorded_by=None) -> MedicalHistory:
    """Adds a new record to the patient's medical history."""
    return MedicalHistory.objects.create(
        patient=patient,
        recorded_by=recorded_by,
        **data
    )


def update_medical_history(*, history: MedicalHistory, data: dict) -> MedicalHistory:
    """Updates an existing medical history record."""
    for field, value in data.items():
        setattr(history, field, value)
    history.save()
    return history


# ── Encounters ──────────────────────────────────────────────────────────

@transaction.atomic
def start_encounter(*, patient, doctor, appointment=None, chief_complaint: str, user=None) -> Encounter:
    """
    Starts a new clinical encounter.
    If an appointment is provided, its status is updated to Checked In (if not already).
    """
    if appointment:
        from appointments.models import Appointment
        if appointment.status == Appointment.STATUS_SCHEDULED:
            appointment.status = Appointment.STATUS_CHECKED_IN
            appointment.save(update_fields=['status'])
        elif appointment.status not in [Appointment.STATUS_CHECKED_IN, Appointment.STATUS_TRIAGED]:
            raise ValidationError('Encounter can only start from a scheduled, checked-in, or triaged appointment.')

    encounter = Encounter.objects.create(
        patient=patient,
        doctor=doctor,
        appointment=appointment,
        chief_complaint=chief_complaint,
        status=Encounter.STATUS_OPEN
    )

    # ── Audit Logging ──────────────────────────────────────────────────
    if user:
        try:
            from audit.utils import log_action
            log_action(
                user=user,
                action='START',
                model_name='Encounter',
                object_id=encounter.id,
                object_repr=f"Encounter {encounter.id} - {patient}",
                details=f"Started encounter for patient {patient.id} with chief complaint: {chief_complaint[:50]}"
            )
        except Exception:
            pass  # Audit failure must never break the main operation

    return encounter


@transaction.atomic
def close_encounter(*, encounter: Encounter, clinical_notes: str = None, discharge_summary: str = None, user=None) -> Encounter:
    if encounter.status != Encounter.STATUS_OPEN:
        raise ValidationError("Only open encounters can be closed.")

    if clinical_notes is not None:
        encounter.clinical_notes = clinical_notes
    if discharge_summary is not None:
        encounter.discharge_summary = discharge_summary

    encounter.status = Encounter.STATUS_COMPLETED
    encounter.completed_at = timezone.now()
    encounter.save(update_fields=[
                   'status', 'completed_at', 'clinical_notes', 'discharge_summary'])

    if encounter.appointment:
        from appointments.models import Appointment
        encounter.appointment.status = Appointment.STATUS_COMPLETED
        encounter.appointment.save(update_fields=['status'])

    # ── Audit Logging ──────────────────────────────────────────────────
    if user:
        try:
            from audit.utils import log_action
            log_action(
                user=user,
                action='CLOSE',
                model_name='Encounter',
                object_id=encounter.id,
                object_repr=f"Encounter {encounter.id} - {encounter.patient}",
                details=f"Closed encounter. Notes: {clinical_notes[:50] if clinical_notes else 'None'}"
            )
        except Exception:
            pass

    return encounter


@transaction.atomic
def reopen_encounter(*, encounter: Encounter, user=None) -> Encounter:
    """Reopens a completed encounter (e.g. to add more notes or vitals)."""
    if encounter.status == Encounter.STATUS_CANCELLED:
        raise ValidationError("Cancelled encounters cannot be reopened.")

    encounter.status = Encounter.STATUS_OPEN
    encounter.completed_at = None
    encounter.save(update_fields=['status', 'completed_at'])

    if user:
        try:
            from audit.utils import log_action
            log_action(
                user=user,
                action='REOPEN',
                model_name='Encounter',
                object_id=encounter.id,
                object_repr=f"Encounter {encounter.id} - {encounter.patient}",
                details="Encounter reopened"
            )
        except Exception:
            pass

    return encounter


# ── Vitals & Diagnoses ──────────────────────────────────────────────────

def record_vitals(*, encounter: Encounter, data: dict, recorded_by, user=None) -> VitalSign:
    clean_data = {k: v for k, v in data.items() if k != 'encounter'}

    # Always create a new vitals record
    vitals = VitalSign.objects.create(
        encounter=encounter,
        recorded_by=recorded_by,
        **clean_data
    )
    return vitals

    # Create new vitals
    vitals = VitalSign.objects.create(
        encounter=encounter,
        recorded_by=recorded_by,
        **clean_data
    )

    # ── Audit Logging ──────────────────────────────────────────────────
    if user:
        try:
            from audit.utils import log_action
            log_action(
                user=user,
                action='RECORD_VITALS',
                model_name='VitalSign',
                object_id=vitals.id,
                object_repr=f"Vitals for Encounter {encounter.id}",
                details=f"Recorded vitals: BP {clean_data.get('systolic_pressure')}/{clean_data.get('diastolic_pressure')}, HR {clean_data.get('pulse_rate')}"
            )
        except Exception:
            pass

    return vitals


def add_diagnosis(*, encounter: Encounter, data: dict, diagnosed_by, user=None) -> Diagnosis:
    """
    Adds a new diagnosis code to the encounter.

    IMPORTANT: 'data' must NOT contain the 'encounter' key — strip it before calling.
    """
    # Remove encounter from data dict to avoid duplicate kwarg error
    clean_data = {k: v for k, v in data.items() if k != 'encounter'}

    diagnosis = Diagnosis.objects.create(
        encounter=encounter,
        diagnosed_by=diagnosed_by,
        **clean_data
    )

    # ── Audit Logging ──────────────────────────────────────────────────
    if user:
        try:
            from audit.utils import log_action
            log_action(
                user=user,
                action='ADD_DIAGNOSIS',
                model_name='Diagnosis',
                object_id=diagnosis.id,
                object_repr=f"{diagnosis.icd10_code} - {diagnosis.description}",
                details=f"Added diagnosis to Encounter {encounter.id}"
            )
        except Exception:
            pass

    return diagnosis


# ── Radiology Services ──────────────────────────────────────────────────

DUMMY_RADIOLOGY_RESULTS = {
    'CXR': """RADIOLOGICAL REPORT
──────────────────────────────
Test: Chest X-Ray (CXR)
Status: Results Available

Findings: The lungs are clear bilaterally. No evidence of pneumothorax, 
pleural effusion, or consolidation. Cardiac silhouette is within 
normal limits. No acute cardiopulmonary process identified.

Impression: Normal chest radiograph.

Radiologist: RIS-AUTO
Received: {date}""",

    'CT': """RADIOLOGICAL REPORT
──────────────────────────────
Test: CT Scan
Status: Results Available

Findings: No acute intracranial hemorrhage, mass effect, or midline shift.
Ventricles are normal in size and configuration.

Impression: Normal CT study.

Radiologist: RIS-AUTO
Received: {date}""",

    'MRI': """RADIOLOGICAL REPORT
──────────────────────────────
Test: MRI
Status: Results Available

Findings: No acute abnormality detected. Normal anatomical structures.

Impression: Normal MRI study.

Radiologist: RIS-AUTO
Received: {date}""",

    'ULTRASOUND': """RADIOLOGICAL REPORT
──────────────────────────────
Test: Ultrasound
Status: Results Available

Findings: No acute abnormality detected. Normal sonographic appearance.

Impression: Normal ultrasound study.

Radiologist: RIS-AUTO
Received: {date}""",
}


@transaction.atomic
def create_radiology_order(*, encounter, patient, ordered_by, test, clinical_notes=''):
    """Creates a new radiology order and auto-generates dummy results."""
    from .models import RadiologyOrder
    from django.utils import timezone
    
    radiology_order = RadiologyOrder.objects.create(
        encounter=encounter,
        patient=patient,
        ordered_by=ordered_by,
        test=test,
        clinical_notes=clinical_notes,
        status='S',  # Sent to RIS
    )
    
    # Auto-generate dummy result
    test_name = test.name.upper() if hasattr(test, 'name') else str(test).upper()
    
    result_text = None
    for key, template in DUMMY_RADIOLOGY_RESULTS.items():
        if key in test_name:
            result_text = template.format(date=timezone.now().strftime('%Y-%m-%d %H:%M'))
            break
    
    if not result_text:
        result_text = f"""RADIOLOGICAL REPORT
──────────────────────────────
Test: {test.name if hasattr(test, 'name') else test}
Status: Results Available

Findings: No acute abnormality detected.

Impression: Normal study.

Radiologist: RIS-AUTO
Received: {timezone.now().strftime('%Y-%m-%d %H:%M')}"""
    
    radiology_order.status = 'R'  # Results Received
    radiology_order.result_text = result_text
    radiology_order.result_received_at = timezone.now()
    radiology_order.ris_order_id = f"RIS-AUTO-{radiology_order.id}"
    radiology_order.save(update_fields=[
        'status', 'result_text', 'result_received_at', 'ris_order_id'
    ])
    
    return radiology_order





@transaction.atomic
def receive_radiology_results(*, radiology_order, result_file=None, result_text='', ris_order_id=''):
    """Simulate receiving results from the RIS."""
    from .models import RadiologyOrder
    radiology_order.status = RadiologyOrder.STATUS_RESULTS_IN
    radiology_order.result_file = result_file
    radiology_order.result_text = result_text
    radiology_order.ris_order_id = ris_order_id
    radiology_order.result_received_at = timezone.now()
    radiology_order.save(update_fields=[
        'status', 'result_file', 'result_text',
        'ris_order_id', 'result_received_at'
    ])
    return radiology_order
