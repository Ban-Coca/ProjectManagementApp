from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path('', RedirectView.as_view(url='/home/', permanent=False)),  # Redirect root URL to /home/
    path('home/', views.home, name='home'),  # Displays home on /home/
    path('projects_list/', views.projects_list, name='projects_list'),  # Displays projects list on /projects_list/
    path('projects_list/create_project/', views.create_project, name='create_project'),
    path('projects/<int:pk>/', views.project_detail, name='project_detail'),
    path('projects/delete/<int:pk>/', views.delete_project, name='delete_project'),
]