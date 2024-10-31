from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from project_planning_and_scheduling.models import Project
from task_management.models import Tasks

@login_required  # Make this view accessible only to authenticated users
def dashboard_view(request):
    # Get all projects for the dropdown
    projects = Project.objects.all()
    
    # Get the selected project from query parameters
    project_id = request.GET.get('project_id')
    selected_project = None
    
    # Filter tasks based on selected project
    if project_id:
        selected_project = get_object_or_404(Project, id=project_id)
        in_progress_tasks = Tasks.objects.filter(
            project=selected_project,
            status='In Progress'
        ).count()
        completed_tasks = Tasks.objects.filter(
            project=selected_project,
            status='Done'
        ).count()
    else:
        # Show stats for all projects if no project is selected
        in_progress_tasks = Tasks.objects.filter(status='In Progress').count()
        completed_tasks = Tasks.objects.filter(status='Done').count()

    context = {
        'projects': projects,
        'selected_project': selected_project,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
    }
    
    return render(request, 'dashboard.html', context)

@login_required  # Make this view accessible only to authenticated users
def project_dashboard_view(request, project_id):
    # Get the selected project by its ID
    user = request.user
    project = get_object_or_404(Project, id=project_id, owner=user)
    projects = Project.objects.filter(owner=user).distinct()  # For the dropdown

    return render(request, 'dashboard.html', {
        'selected_project': project,
        'projects': projects
    })
