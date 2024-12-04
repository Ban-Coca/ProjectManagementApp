from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse,FileResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.core.exceptions import ValidationError
from django.db import transaction
import json
import logging
from .models import Tasks
from project_planning_and_scheduling.models import Project, ProjectMember
from .forms import TaskForm
from user_authentication.models import User
from django.db.models import Q
from django.core.files.storage import default_storage
from django.conf import settings
import os
import mimetypes
from django.views.decorators.clickjacking import xframe_options_exempt

logger = logging.getLogger(__name__)

# Create your views here.
def task_management(request, id):
    return render(request, 'task_management/task_management.html')

def kanban_board(request):
    return render(request, 'task_management/kanban_board.html')

@require_http_methods(["GET"])
def list_tasks(request, project_id):
    # Ensure the project exists
    project = get_object_or_404(Project, id=project_id)
    
    # Filter tasks by project_id
    tasks = Tasks.objects.filter(project_id=project_id)
    task_list = [{
        'task_id': task.task_id,
        'project_id': task.project_id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'due_date': task.due_date,
        'created_by': task.created_by,
        'assigned_to': str(task.assigned_to)
    } for task in tasks]
    return JsonResponse({'task_list': task_list})

@csrf_exempt
def add_task(request):
    if request.method == 'POST':
        try:
            print(f"Raw request body: {request.body}")
            data = json.loads(request.body)
            
            project = get_object_or_404(Project, id=data['project_id'])

            # Check if user has access to this project
            if not (project.owner == request.user or 
                    ProjectMember.objects.filter(project=project, user=request.user).exists()):
                return JsonResponse({"error": "Access denied"}, status=403)

            with transaction.atomic():
                task = Tasks(
                    project=project,  # Ensure this matches your model field
                    title=data['title'],
                    description=data['description'],
                    status=data['status'],
                    priority=data['priority'],
                    due_date=data['dueDate'],
                    assigned_to=data['assignee'],  # Ensure this matches your model field
                )
                task.save()

                # Check if this is the first task in the project
                if project.tasks_set.count() == 1:
                    project.status = 'In Progress'
                    project.save()

            return JsonResponse({'success': True})
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@require_http_methods(["GET"])
def task_detail(request, task_id):
    task = get_object_or_404(Tasks, task_id=task_id)
    task_detail = {
        'task_id': task.task_id,
        'project_id': task.project_id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'due_date': task.due_date,
        'created_by': task.created_by,
        'assigned_to': str(task.assigned_to)
    }
    return JsonResponse(task_detail) 

@csrf_exempt
@require_http_methods(["PUT"])
def update_task(request, task_id):
    try:
        # Parse request data
        data = json.loads(request.body)
        field = data.get('field')
        value = data.get('value')

        # Basic validation
        if not field or value is None:
            return JsonResponse({
                'success': False,
                'message': 'Field and value are required'
            }, status=400)

        # Get task instance
        task = get_object_or_404(Tasks, task_id=task_id)

        # Validate field exists on model
        if not hasattr(task, field):
            return JsonResponse({
                'success': False,
                'message': f'Invalid field: {field}'
            }, status=400)

        # Update the specific field
        setattr(task, field, value)
        
        # Save the changes
        task.save(update_fields=[field])

        logger.debug(f'Updated task {task_id}: {field} = {value}')

        return JsonResponse({
            'success': True,
            'message': 'Task updated successfully',
            'task': {
                'id': task.task_id,
                field: value
            }
        })

    except json.JSONDecodeError:
        logger.error('Invalid JSON in request body')
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON in request body'
        }, status=400)
    
    except Exception as e:
        logger.error(f"Error updating task {task_id}: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'An unexpected error occurred',
            'error': str(e)
        }, status=500)
    
@csrf_exempt
def update_task_simple(request, task_id):
    if request.method == 'PUT':
        try:
            # Parse JSON body
            body = json.loads(request.body)

            # Retrieve the task by ID
            task = get_object_or_404(Tasks, task_id=task_id)

            # Update task fields
            task.title = body.get('title', task.title)
            print(task.title)
            task.due_date = body.get('due_date', task.due_date)
            task.project_id = body.get('project_id', task.project.id)
            task.priority = body.get('priority', task.priority)
            task.status = body.get('status', task.status)
            task.description = body.get('description', task.description)

            # Save the updated task
            task.save()

            return JsonResponse({'message': 'Task updated successfully'}, status=200)

        except Tasks.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Invalid HTTP method. Use PUT.'}, status=405)


@require_http_methods(["DELETE"])
def delete_task(request, task_id):
    task = get_object_or_404(Tasks, task_id=task_id)
    task.delete()
    return JsonResponse({'success': True})

def search_members(request, project_id):
    try:
        # Get the project, ensuring current user has access
        project = get_object_or_404(Project, id=project_id)
        
        query = request.GET.get('q', '').strip()
        
        # Get IDs of existing project members
        existing_member_ids = ProjectMember.objects.filter(
            project=project
        ).values_list('user_id', flat=True)
        
        # Base queryset for existing members
        users_queryset = User.objects.filter(
            user_id__in=existing_member_ids
        )
        
        # Search if query provided
        if query:
            users = users_queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            ).distinct()[:10]
        else:
            users = users_queryset.none()
        
        # Serialize user data
        users_data = [{
            'id': str(user.user_id),  # Use id instead of user_id
            'username': user.username,
            'email': user.email,
            'full_name': f"{user.first_name} {user.last_name}".strip()
        } for user in users]
        
        return JsonResponse(users_data, safe=False)
    
    except Exception as e:
        logger.error(f"User search error: {e}", exc_info=True)
        return JsonResponse({
            "error": "Search failed", 
            "details": str(e)
        }, status=500)
    
def tasks_list(request):
    return render(request, 'task_management/taskslist.html')

@require_http_methods(["POST"])
def upload_file(request):
    if request.FILES.get('file'):
        try:
            file = request.FILES['file']
            file_name = default_storage.save(file.name, file)
            return JsonResponse({'fileName': file_name})
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'No file provided'}, status=400)

@require_http_methods(["GET"])
@xframe_options_exempt
def view_file(request, filename):
    try:
        file_path = default_storage.path(filename)
        if os.path.exists(file_path):
            content_type, _ = mimetypes.guess_type(file_path)
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            # Don't set Content-Disposition to allow browser to display inline
            response['X-Frame-Options'] = 'SAMEORIGIN'
            return response
        return JsonResponse({'error': 'File not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)
@require_http_methods(["GET"])
def documents(request):
    try:
        # Get files from media directory
        files = [{'name': name} for name in os.listdir(settings.MEDIA_ROOT)]
        return render(request, 'task_management/documents.html', {'files': files})
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return render(request, 'task_management/documents.html', {'files': [], 'error': str(e)})