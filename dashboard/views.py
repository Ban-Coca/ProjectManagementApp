from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from project_planning_and_scheduling.models import Project
from task_management.models import Tasks
from django.http import JsonResponse
import logging
from django.db.models.functions import TruncDate
from django.db.models import Count, Q

logger = logging.getLogger(__name__)

@login_required
def dashboard_view(request):
    user = request.user
    project_id = request.GET.get('project_id')
    user_projects = None

    # Fetch all projects where the user is a member or owner if project_id is 'all'
    if project_id == 'all':
        user_projects = Project.objects.filter(projectmember__user=user).distinct()
    elif project_id:
        # Try to fetch the specific project by project_id
        try:
            project_id = int(project_id)
            user_projects = Project.objects.filter(projectmember__user=user, id=project_id)
        except ValueError:
            return render(request, 'dashboard.html', {'error': 'Invalid project ID format'})
    else:
        # Default to fetching all projects the user is a member of
        user_projects = Project.objects.filter(projectmember__user=user).distinct()

    if not user_projects.exists():
        return render(request, 'dashboard.html', {'error': 'No accessible projects found'})

    # Fetch project stats and aggregate task data
    data = get_project_task_data(user_projects)

    # If the request is AJAX, return the task data as a JSON response
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'to_do_tasks': data['to_do_tasks'],
            'in_progress_tasks': data['in_progress_tasks'],
            'completed_tasks': data['completed_tasks'],
            'project_titles': data['project_titles'],
            'total_tasks': data['total_tasks'],
        })

    # For non-AJAX requests, render the regular dashboard page
    context = {
        'projects': user_projects,
        'data': data,
        'selected_project': project_id if project_id != 'all' else None,
    }

    return render(request, 'dashboard.html', context)


def get_project_task_data(user_projects):
    """
    Helper function to get aggregated task data for the user's projects.
    Returns a dictionary with task counts and project titles.
    """
    project_stats = user_projects.values('id', 'title').annotate(
        total_tasks=Count('tasks'),
        total_members=Count('projectmember'),
        to_do_tasks=Count('tasks', filter=Q(tasks__status='TODO')),
        in_progress_tasks=Count('tasks', filter=Q(tasks__status='INPROGRESS')),
        completed_tasks=Count('tasks', filter=Q(tasks__status='DONE'))
    )

    # Initialize the data dictionary to accumulate task counts and project titles
    data = {
        'total_projects': user_projects.count(),
        'total_tasks': [],
        'total_members': 0,
        'to_do_tasks': 0,
        'in_progress_tasks': 0,
        'completed_tasks': 0,
        'project_titles': []  # List to store project titles
    }

    # Aggregate task data from the project statistics
    for stats in project_stats:
        data['total_tasks'].append(stats['total_tasks'])
        data['total_members'] += stats['total_members']
        data['to_do_tasks'] += stats['to_do_tasks']
        data['in_progress_tasks'] += stats['in_progress_tasks']
        data['completed_tasks'] += stats['completed_tasks']
        data['project_titles'].append(stats['title'])  # Add the project title

    # Optionally print the aggregated data for debugging purposes
    print("Aggregated Task Data before passing:", data)

    return data