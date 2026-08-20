from rest_framework import serializers
from .models import Medicine, Prescription, PrescriptionItem


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'strength', 'form', 'description']


class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.IntegerField(  # ← Change from PrimaryKeyRelatedField to IntegerField
        source='medicine',
        write_only=True,
        required=False,
        allow_null=True
    )
    medicine_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = PrescriptionItem
        fields = ['id', 'medicine', 'medicine_id', 'dosage','medicine_name',
                  'frequency', 'duration', 'quantity', 'instructions']
    def validate_medicine_id(self, value):
        return value


class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True, source='prescriptionitem_set')
    prescribed_by_name = serializers.CharField(
        source='prescribed_by.user.get_full_name', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)


    class Meta:
        model = Prescription
        fields = [
            'id', 'encounter', 'prescribed_by', 'prescribed_by_name',
            'status', 'status_display', 'instructions', 'prescribed_at',
            'items'
        ]
        read_only_fields = ['prescribed_at', 'status']


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model = Prescription
        fields = ['encounter', 'prescribed_by', 'instructions', 'items']
        extra_kwargs = {
            'prescribed_by': {'required': False},
        }

    def create(self, validated_data):
        from .models import Medicine
        
        items_data = validated_data.pop('items')
        prescription = Prescription.objects.create(**validated_data)
        
        for item_data in items_data:
            medicine_id = item_data.pop('medicine', None)
            medicine_name = item_data.pop('medicine_name', '')
            
            # Find medicine by ID, or by name, or create new
            medicine = None
            if medicine_id and medicine_id != 0:
                try:
                    medicine = Medicine.objects.get(pk=medicine_id)
                except Medicine.DoesNotExist:
                    pass
            
            if not medicine and medicine_name:
                medicine, created = Medicine.objects.get_or_create(
                    name__iexact=medicine_name,
                    defaults={
                        'name': medicine_name,
                        'strength': item_data.get('dosage', ''),
                        'form': 'Tablet',
                    }
                )
            
            if not medicine:
                medicine, created = Medicine.objects.get_or_create(
                    name='Unknown Medicine',
                    defaults={'strength': '', 'form': 'Tablet'}
                )
            
            PrescriptionItem.objects.create(
                prescription=prescription,
                medicine=medicine,
                **item_data
            )
        return prescription
