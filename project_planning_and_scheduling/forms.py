from django import forms
from .models import Project

class ProjectForm(forms.Form):
    class Meta:
        model = Project
        fields = ['title', 'description', 'status', 'due_date']
        widgets = {
            'due_date': forms.DateInput(attrs={'type': 'date'}),
        }