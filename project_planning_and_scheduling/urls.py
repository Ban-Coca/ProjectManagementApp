from django.urls import path
from django.views.generic import RedirectView
from . import views
from task_management.views import kanban_board, task_management

app_name = 'project_planning_and_scheduling'

urlpatterns = [
    path('', views.projects_list, name='projects_list'),  # Displays projects list on /projects_list/
    path('create/', views.create_project, name='create_project'),
    path('<int:pk>/', views.project_detail, name='project_detail'),
    path('delete/<int:pk>/', views.delete_project, name='delete_project'),
    path('<int:pk>/board', kanban_board, name='kanban_board'),
    path('<int:pk>/tasks', task_management, name='task_management'),
    path('<int:pk>/tasks', task_management, name='document'),
    # path('<int:project_id>/members/', views.get_project_members, name='get_project_members'),
    # path('<int:project_id>/members/add/', views.add_project_member, name='add_project_member'),
    # path('<int:project_id>/users/search/', views.search_users, name='search_users'),
]