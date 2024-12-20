# Generated by Django 5.1.1 on 2024-12-04 13:16

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('project_planning_and_scheduling', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tasks',
            fields=[
                ('task_id', models.CharField(editable=False, max_length=20, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('status', models.CharField(choices=[('TODO', 'To Do'), ('INPROGRESS', 'In Progress'), ('DONE', 'Done')], max_length=20)),
                ('priority', models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High')], max_length=20)),
                ('due_date', models.DateField()),
                ('created_by', models.CharField(max_length=100)),
                ('assigned_to', models.CharField(max_length=100)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='project_planning_and_scheduling.project')),
            ],
        ),
    ]
