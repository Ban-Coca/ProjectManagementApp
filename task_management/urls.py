from django.urls import path
from . import views

app_name = 'task_management'

urlpatterns = [
    # Static/specific paths first
    path('documents/', views.documents, name='documents'),
    path('upload_file/', views.upload_file, name='upload_file'),  # Changed from upload/
    path('files/<str:filename>/', views.view_file, name='view_file'),
    path('', views.task_management, name='task_management'),
    path('task_list/<int:project_id>/', views.list_tasks, name='list_tasks'),    
    path('board', views.kanban_board, name='kanban_board'),
    path('add_task/', views.add_task, name='add_task'),
    path('<str:task_id>/', views.task_detail, name='task_detail'),
    path('<str:task_id>/update_task/', views.update_task, name='update_task'),
    path('<str:task_id>/delete_task/', views.delete_task, name='delete_task'),
    path('<int:project_id>/search_members/', views.search_members, name='search_members'),
    path('update_simple/<str:task_id>/', views.update_task_simple, name='update_task_simple'),
    path('tasks/',views.tasks_list,name='tasks_list'),
]