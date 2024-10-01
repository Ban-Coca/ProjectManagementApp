from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    user_id = models.CharField(max_length=100, unique=True)
    bio = models.TextField(blank=True, null=True)

    # Set user_id as the primary identifier instead of username
    USERNAME_FIELD = 'user_id'
    REQUIRED_FIELDS = ['email']  # This will require the user to provide an email when creating a superuser

    def __str__(self):
        return self.user_id  # Display the user_id as the string representation
