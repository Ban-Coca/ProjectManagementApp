from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
import json
import logging
from .models import Tasks
from .forms import TaskForm
logger = logging.getLogger(__name__)
# Create your views here.
def task_management(request):
    return render(request, 'task_management/task_management.html')

@require_http_methods(["GET"])
def list_tasks(request):
    tasks = Tasks.objects.all()
    task_list = [{
        'task_id': task.task_id,
        'project_id': task.project_id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'due_date': task.due_date,
        'created_by': task.created_by,
        'assigned_to': task.assigned_to
        } for task in tasks]
    return JsonResponse({'task_list': task_list})

@csrf_exempt
def add_task(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task = Tasks(
                title=data['title'],
                description=data['description'],
                status=data['status'],
                priority=data['priority'],
                due_date=data['dueDate'],
                assigned_to=data['assignee']  # Ensure this matches your model field
            )
            task.save()
            return JsonResponse({'success': True})
        except Exception as e:
            # Log the error message
            print(f"Error: {str(e)}")
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

        # Print for debugging
        print(f'Updated task {task_id}: {field} = {value}')

        return JsonResponse({
            'success': True,
            'message': 'Task updated successfully',
            'task': {
                'id': task.task_id,
                field: value
            }
        })

    except json.JSONDecodeError:
        print('Invalid JSON in request body')
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON in request body'
        }, status=400)
    
    except Exception as e:
        # Print the error for debugging
        print(f"Error updating task {task_id}: {str(e)}")
        
        return JsonResponse({
            'success': False,
            'message': 'An unexpected error occurred',
            'error': str(e)
        }, status=500)


@require_http_methods(["DELETE"])
def delete_task(request, task_id):
    task = get_object_or_404(Tasks, task_id=task_id)
    task.delete()
    return JsonResponse({'success': True})