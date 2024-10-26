from django.urls import path
from django.views.generic import RedirectView
from . import views

app_name = 'project_planning_and_scheduling'

urlpatterns = [
    path('', views.projects_list, name='projects_list'),  # Displays projects list on /projects_list/
    path('create/', views.create_project, name='create_project'),
    path('<int:pk>/', views.project_detail, name='project_detail'),
    path('delete/<int:pk>/', views.delete_project, name='delete_project'),
]