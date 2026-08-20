from rest_framework import serializers
from .models import FileAttachment


class FileAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.user.get_full_name',
        read_only=True
    )
    patient_name = serializers.CharField(
        source='patient.user.get_full_name',
        read_only=True
    )

    class Meta:
        model = FileAttachment
        fields = [
            'id', 'encounter', 'patient', 'patient_name',
            'uploaded_by', 'uploaded_by_name', 'file',
            'file_type', 'description', 'uploaded_at'
        ]
        read_only_fields = ['uploaded_by', 'uploaded_at']
        extra_kwargs = {
            'patient': {'required': False},
            'file': {'write_only': True},
        }

    def validate(self, attrs):
        encounter = attrs.get('encounter') or getattr(self.instance, 'encounter', None)
        patient = attrs.get('patient') or getattr(self.instance, 'patient', None)

        if encounter and not patient:
            attrs['patient'] = encounter.patient
            return attrs

        if encounter and patient and encounter.patient_id != patient.id:
            raise serializers.ValidationError({
                'patient': 'Attachment patient must match the selected encounter patient.'
            })

        return attrs
