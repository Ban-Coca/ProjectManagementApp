from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_management, name='task_management'),
    path('tasks/', views.list_tasks, name='list_tasks'),
    path('tasks/board', views.kanban_board, name='kanban_board'),
    path('tasks/add_task/', views.add_task, name='add_task'),
    path('tasks/<str:task_id>/', views.task_detail, name='task_detail'),
    path('tasks/<str:task_id>/update_task/', views.update_task, name='update_task'),
    path('tasks/<str:task_id>/delete_task/', views.delete_task, name='delete_task'),
]
