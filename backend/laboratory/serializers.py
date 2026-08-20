from rest_framework import serializers
from .models import LabTest, LabOrder

class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = '__all__'

class LabOrderSerializer(serializers.ModelSerializer):
    test = LabTestSerializer(read_only=True)
    test_id = serializers.PrimaryKeyRelatedField(
        queryset=LabTest.objects.all(),
        source='test',
        write_only=True
    )
    ordered_by_name = serializers.CharField(source='ordered_by.user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.user.get_full_name', read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
                                             
                                             

    class Meta:
        model = LabOrder
        fields = [
            'id', 'encounter', 'patient', 'ordered_by', 'ordered_by_name',
            'test', 'test_id', 'status', 'status_display',
            'clinical_notes', 'lms_order_id', 'result_file', 'result_text',
            'result_received_at', 'ordered_at', 'updated_at',
            'verified_by', 'verified_by_name', 'verified_at', 'is_verified',
        ]
        read_only_fields = ['ordered_at', 'updated_at', 'status', 'lms_order_id', 'result_file', 'result_text', 'result_received_at', 'verified_by', 'verified_at', 'is_verified']

class LabOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabOrder
        fields = ['encounter', 'patient', 'test', 'ordered_by', 'clinical_notes']