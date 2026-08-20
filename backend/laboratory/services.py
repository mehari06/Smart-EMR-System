from django.db import transaction
from django.utils import timezone
from .models import LabOrder

# ── ADD THIS ENTIRE BLOCK ──────────────────────────────────────────────
DUMMY_LAB_RESULTS = {
    'CBC': """LABORATORY REPORT
──────────────────────────────
Test: Complete Blood Count (CBC)
Status: Verified

WBC:     7.2 x10^3/uL   (Ref: 4.5 - 11.0)
RBC:     4.8 x10^6/uL   (Ref: 4.5 - 5.9)
HGB:     14.2 g/dL      (Ref: 13.5 - 17.5)
HCT:     42.5 %         (Ref: 41.0 - 53.0)
PLT:     250 x10^3/uL   (Ref: 150 - 450)

Technician: LIS-AUTO
Received: {date}""",

    'BMP': """LABORATORY REPORT
──────────────────────────────
Test: Basic Metabolic Panel (BMP)
Status: Verified

Glucose:     95 mg/dL     (Ref: 70 - 100)
Sodium:      140 mmol/L   (Ref: 135 - 145)
Potassium:   4.2 mmol/L   (Ref: 3.5 - 5.0)
Chloride:    102 mmol/L   (Ref: 98 - 107)
CO2:         25 mmol/L    (Ref: 22 - 29)
BUN:         15 mg/dL     (Ref: 7 - 20)
Creatinine:  0.9 mg/dL    (Ref: 0.6 - 1.2)

Technician: LIS-AUTO
Received: {date}""",
}
# ── END OF DUMMY RESULTS BLOCK ─────────────────────────────────────────


@transaction.atomic
def create_lab_order(*, encounter, patient, ordered_by, test, clinical_notes=''):
    # ── CHANGE THIS LINE (was just LabOrder.objects.create) ──────────
    lab_order = LabOrder.objects.create(
        encounter=encounter,
        patient=patient,
        ordered_by=ordered_by,
        test=test,
        clinical_notes=clinical_notes,
        status=LabOrder.STATUS_SENT,  # ← ADD THIS LINE
    )

    # ── ADD THESE 2 LINES ────────────────────────────────────────────
    _auto_generate_lab_result(lab_order)

    return lab_order  # ← CHANGE: return lab_order instead of direct create


# ── ADD THIS ENTIRE FUNCTION ───────────────────────────────────────────
def _auto_generate_lab_result(lab_order):
    """Simulate LIS returning results automatically."""
    test_name = lab_order.test.name.upper()

    # Try to match known test or use generic result
    result_text = DUMMY_LAB_RESULTS.get(
        test_name,
        f"""LABORATORY REPORT
──────────────────────────────
Test: {lab_order.test.name}
Status: Verified

All parameters within normal limits.

Technician: LIS-AUTO  
Received: {timezone.now().strftime('%Y-%m-%d %H:%M')}"""
    ).format(date=timezone.now().strftime('%Y-%m-%d %H:%M'))

    lab_order.status = LabOrder.STATUS_RESULTS_IN
    lab_order.result_text = result_text
    lab_order.result_received_at = timezone.now()
    lab_order.lms_order_id = f"LIS-AUTO-{lab_order.id}"
    lab_order.save(update_fields=[
        'status', 'result_text', 'result_received_at', 'lms_order_id'
    ])
# ── END OF NEW FUNCTION ────────────────────────────────────────────────


@transaction.atomic
def receive_lab_results(*, lab_order, result_file=None, result_text='', lms_order_id=''):
    """Simulate receiving results from the LMS."""
    lab_order.status = LabOrder.STATUS_RESULTS_IN
    lab_order.result_file = result_file
    lab_order.result_text = result_text
    lab_order.lms_order_id = lms_order_id
    lab_order.result_received_at = timezone.now()
    lab_order.save(update_fields=[
                   'status', 'result_file', 'result_text', 'lms_order_id', 'result_received_at'])
    return lab_order
