# views.py
from django.shortcuts import render, get_object_or_404
from .models import Project, ProjectMember

def home(request):
    # Get the first project for demonstration (you may want to customize this)
    project = Project.objects.first()  # or filter to get the relevant project
    members = ProjectMember.objects.filter(project=project)  # Get members for the project

    context = {
        'project': project,
        'members': members,
    }
    return render(request, 'home.html', context)