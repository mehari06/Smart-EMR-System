# Generated manually to align backend roles with frontend route access.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_user_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[
                ('admin', 'Administrator'),
                ('doctor', 'Doctor'),
                ('nurse', 'Nurse'),
                ('pharmacist', 'Pharmacist'),
                ('lab_tech', 'Lab Technician'),
                ('receptionist', 'Receptionist'),
                ('staff_head', 'Staff Head'),
                ('patient', 'Patient'),
            ], max_length=20),
        ),
    ]