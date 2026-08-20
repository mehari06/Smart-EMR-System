from django.db import transaction
from .models import Medicine, Prescription, PrescriptionItem


def _resolve_medicine(*, medicine=None, medicine_name='', dosage=''):
    if isinstance(medicine, Medicine):
        return medicine

    if medicine and medicine != 0:
        try:
            return Medicine.objects.get(pk=medicine)
        except Medicine.DoesNotExist:
            pass

    if medicine_name:
        resolved, _ = Medicine.objects.get_or_create(
            name__iexact=medicine_name,
            defaults={
                'name': medicine_name,
                'strength': dosage,
                'form': 'Tablet',
            },
        )
        return resolved

    fallback = Medicine.objects.first()
    if fallback:
        return fallback

    return Medicine.objects.create(
        name='Unknown Medicine',
        strength='',
        form='Tablet',
    )


@transaction.atomic
def create_prescription(*, encounter, prescribed_by, instructions='', items):
    """Creates a prescription with multiple items."""
    prescription = Prescription.objects.create(
        encounter=encounter,
        prescribed_by=prescribed_by,
        instructions=instructions,
    )

    for item in items:
        dosage = item.get('dosage', '')
        medicine = _resolve_medicine(
            medicine=item.get('medicine'),
            medicine_name=item.get('medicine_name', ''),
            dosage=dosage,
        )

        PrescriptionItem.objects.create(
            prescription=prescription,
            medicine=medicine,
            dosage=dosage,
            frequency=item.get('frequency', ''),
            duration=item.get('duration', ''),
            quantity=item.get('quantity', 1),
            instructions=item.get('instructions', ''),
        )

    return prescription
