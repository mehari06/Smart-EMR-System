# Generated manually to persist triage vital fields added to Appointment.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0004_alter_appointment_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='pain_score',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='temperature',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='heart_rate',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='systolic_bp',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='diastolic_bp',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='oxygen_saturation',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='appointment',
            name='respiratory_rate',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]