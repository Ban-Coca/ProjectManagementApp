from django.urls import path
from django.views.generic import RedirectView
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.dashboard_view, name='dashboard_view'),
    path('<int:project_id>/', views.project_dashboard_view, name='project_dashboard_view'),
]