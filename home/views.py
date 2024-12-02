from django.shortcuts import render
from project_planning_and_scheduling.models import Project
from task_management.models import Tasks
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    # Get projects where user is owner or member
    owned_projects = Project.objects.filter(owner=request.user)
    member_projects = Project.objects.filter(projectmember__user=request.user)
    projects = (owned_projects | member_projects).distinct()

    # Group tasks by project
    tasks_by_project = {}
    for project in projects:
        tasks_by_project[project] = Tasks.objects.filter(project=project)

    return render(request, 'home.html', {'projects': projects, 'tasks_by_project': tasks_by_project})
