from django.urls import path
from django.views.generic import RedirectView
from . import views

app_name = 'home'

urlpatterns = [
    path('', views.home, name='home'),  # Displays home on /home/
]