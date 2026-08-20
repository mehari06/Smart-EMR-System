from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('clinical', '0001_initial'),
        ('prescriptions', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='prescription',
            name='encounter',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='prescriptions',
                to='clinical.encounter',
            ),
        ),
    ]
