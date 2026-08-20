from .models import Prescription

def get_prescriptions_for_encounter(encounter_id):
    return (
        Prescription.objects
        .filter(encounter_id=encounter_id)
        .select_related(
            'prescribed_by__user',
            'encounter__patient__user',
        )
        .prefetch_related('items__medicine')
    )


def get_prescription_by_id(prescription_id):
    """Returns a single prescription by ID."""
    return Prescription.objects.select_related('prescribed_by').prefetch_related('prescriptionitem_set__medicine').get(pk=prescription_id)
