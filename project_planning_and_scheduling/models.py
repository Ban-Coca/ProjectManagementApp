from django.db import models
from django.conf import settings

class Project(models.Model):
    STATUS = [
        ("TODO", "To Do"),
        ("INPROGRESS", "In Progress"),
        ("DONE", "Done")
    ]
    
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS, default='TODO')

    def __str__(self):
        return self.title
    
    def is_member(self, user):
        return self.projectmember_set.filter(user=user).exists()
    
    

class ProjectMember(models.Model):
    ROLE_CHOICES = [
        ("OWNER", "Owner"),
        ("MEMBER", "Member"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=6, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.project.title}"
    
    def is_owner(self):

        return self.role
