from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_management, name='task_management'),
    path('tasks/', views.list_tasks, name='list_tasks'),
    path('tasks/add_task/', views.add_task, name='add_task'),
]
