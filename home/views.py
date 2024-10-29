from django.shortcuts import render
from project_planning_and_scheduling.models import Project

def home(request):
    projects = Project.objects.all()  # Fetching all projects
    return render(request, 'home.html', {'projects': projects})