from django.shortcuts import render
from project_planning_and_scheduling.models import Project
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    user = request.user
    projects = Project.objects.filter(owner=user)
    projects = projects.distinct()  # Ensure no duplicate projects
    return render(request, 'home.html', {'projects': projects})


