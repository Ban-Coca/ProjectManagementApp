# Generated by Django 5.1.1 on 2024-10-31 07:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('project_planning_and_scheduling', '0003_project_project_number_alter_project_status'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='project_number',
        ),
    ]
