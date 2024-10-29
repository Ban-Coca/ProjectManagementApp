from django.urls import path
from .views import login_view, register, forgot_password

app_name = 'auth'

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register, name='register'),
    path('password_reset/', forgot_password, name='password_reset'),
]