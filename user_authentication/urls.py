from django.urls import path
from .views import login_view, register, forgot_password, set_new_password, custom_logout, logged_out

app_name = 'auth'

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register, name='register'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('set-new-password/<str:email>/', set_new_password, name='set_new_password'),
    path('logout/', custom_logout, name='logout'),  # Use the custom logout view
    path('logged_out/', logged_out, name='logged_out'),  # Add this line for the logged out page
]