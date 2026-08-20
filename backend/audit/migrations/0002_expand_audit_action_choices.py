# Generated manually for audit action vocabulary hardening.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                choices=[
                    ('CREATE', 'Create'),
                    ('READ', 'Read'),
                    ('UPDATE', 'Update'),
                    ('DELETE', 'Delete'),
                    ('EXPORT', 'Export'),
                    ('UPLOAD', 'Upload'),
                    ('DOWNLOAD', 'Download'),
                    ('CLOSE', 'Close'),
                    ('START', 'Start'),
                    ('RECORD_VITALS', 'Record Vitals'),
                    ('ADD_DIAGNOSIS', 'Add Diagnosis'),
                    ('PRESCRIBE', 'Prescribe'),
                    ('ORDER_LAB', 'Order Lab'),
                    ('RECEIVE_LAB_RESULT', 'Receive Lab Result'),
                    ('LOGIN', 'Login'),
                    ('LOGOUT', 'Logout'),
                ],
                max_length=50,
            ),
        ),
    ]
