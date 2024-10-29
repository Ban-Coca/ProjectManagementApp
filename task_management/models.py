from django.db import models
import uuid
# Create your models here.
class Tasks(models.Model):
    STATUS = [
        ("TODO", "To Do"),
        ("INPROGRESS", "In Progress"),
        ("DONE", "Done")
    ]

    PRIORITY = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High")
    ]

    task_id = models.CharField(max_length=20, primary_key=True, editable=False)
    project_id = models.CharField(max_length=20)
    title = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS)
    priority = models.CharField(max_length=20, choices=PRIORITY)
    due_date = models.DateField()
    created_by = models.CharField(max_length=100)
    assigned_to = models.CharField(max_length=100)


    @staticmethod
    def generate_task_id():
        return "TASK" + str(uuid.uuid4().fields[-1])[:6].upper()

    def save(self, *args, **kwargs):
        if not self.task_id:
            self.task_id = self.generate_task_id()
        super(Tasks, self).save(*args, **kwargs)

    def __str__(self):
        return self.title