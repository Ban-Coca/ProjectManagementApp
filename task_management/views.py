from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Tasks
from .forms import TaskForm
import json

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
    task = Tasks.objects.get(task_id=task_id)
    return JsonResponse({'task_id': task_id})
    