"""
URL configuration for project_management_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from task_management.views import tasks_list
from user_authentication.views import redirect_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('user_auth/', include('user_authentication.urls')),
    path('', redirect_view, name='redirect_view'),
    path('projects/', include('project_planning_and_scheduling.urls')),
    path('home/',include('home.urls')),
    path('tasks/', include('task_management.urls')),
    path('dashboard/',include('dashboard.urls')),
    path('tasks/', tasks_list, name='task_list'),
]