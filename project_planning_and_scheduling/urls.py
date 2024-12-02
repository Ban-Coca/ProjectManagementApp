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
    path('<int:project_id>/members/', views.get_project_members, name='get_project_members'),
    path('<int:project_id>/search-users/', views.search_users, name='search_users'),
    path('<int:project_id>/add-member/', views.add_member_to_project, name='add_member_to_project'),
    path('<int:project_id>/remove-member/', views.remove_member, name='remove_member'),
    path('<int:project_id>/is-owner/', views.is_owner, name='is_owner'),
    path('update/<int:pk>/', views.update_project, name='update_project'),
]