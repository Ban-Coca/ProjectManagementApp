from django.http import JsonResponse
from django.shortcuts import render
from project_planning_and_scheduling.models import Project
from task_management.models import Tasks
from django.contrib.auth.decorators import login_required
import logging
from django.db.models import Q

logger = logging.getLogger(__name__)

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

def search_projects(request):
    try:
        query = request.GET.get('q', '').strip()
        
        # Base queryset for projects
        projects_queryset = Project.objects.all()
        
        # Search if query provided
        if query:
            projects = projects_queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query)
            ).distinct()[:10]
        else:
            projects = projects_queryset.none()
        
        # Serialize project data
        project_list = [{
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'start_date': project.start_date,
            'end_date': project.end_date,
            'status': project.get_status_display()
        } for project in projects]
        
        return JsonResponse({'projects': project_list})
    
    except Exception as e:
        logger.error(f"Project search error: {e}", exc_info=True)
        return JsonResponse({
            "error": "Search failed", 
            "details": str(e)
        }, status=500)