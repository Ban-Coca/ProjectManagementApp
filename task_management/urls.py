from django.urls import path
from . import views

app_name = 'task_management'

urlpatterns = [
    path('', views.task_management, name='task_management'),
    path('task_list/', views.list_tasks, name='list_tasks'),    
    path('board', views.kanban_board, name='kanban_board'),
    path('add_task/', views.add_task, name='add_task'),
    path('<str:task_id>/', views.task_detail, name='task_detail'),
    path('<str:task_id>/update_task/', views.update_task, name='update_task'),
    path('<str:task_id>/delete_task/', views.delete_task, name='delete_task'),
    path('list_by_project/<int:project_id>/', views.list_by_project, name='list_by_project'),
    # path('tasks/search_assignee/', views.search_users, name='search_users'),
    path('usertasks/<uuid:id>',views.user_tasks,name='user_tasks'),
]
