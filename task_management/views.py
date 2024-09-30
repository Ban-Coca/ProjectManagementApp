from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
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

@require_http_methods(["POST"])
def add_task(request):
    data = json.loads(request.body)
    form = TaskForm(data)
    if form.is_valid():
        task = form.save()
        return JsonResponse({
            'task_id': task.task_id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
        })
    else:
        return JsonResponse({'erroro': form.errors}, status=400)
    