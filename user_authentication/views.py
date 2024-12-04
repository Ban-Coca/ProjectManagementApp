from django.shortcuts import render, redirect
from .forms import SignUpForm, CustomAuthenticationForm
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.contrib import messages
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string
from django.contrib.auth import logout
from django.contrib.auth import get_user_model

User = get_user_model()

def redirect_view(request):
    if request.user.is_authenticated:
        return redirect('home:home')  # Redirect to the home page if logged in
    else:
        return redirect('auth:login')  # Redirect to the login page if not logged in
    
# Your existing views remain unchanged
def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                auth_login(request, user)
                return redirect('home:home')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'login.html', {'form': form})

def register(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        try:
            with transaction.atomic():
                if form.is_valid():
                    user = form.save(commit=False)
                    user.first_name = form.cleaned_data.get('first_name')
                    user.last_name = form.cleaned_data.get('last_name')
                    user.save()
                    raw_password = form.cleaned_data.get('password1')
                    user = authenticate(username=user.username, password=raw_password)
                    if user is not None:
                        auth_login(request, user)
                        messages.success(request, 'Registration successful!')
                        print("Registration successful!")
                        return redirect('auth:login')
                    else:
                        messages.error(request, 'Failed to authenticate after registration.')
                else:
                    for field, errors in form.errors.items():
                        for error in errors:
                            messages.error(request, f"{field}: {error}")
        except Exception as e:
            messages.error(request, f'Registration failed: {str(e)}')
            print(f"Registration error: {str(e)}")
    else:
        form = SignUpForm()
    return render(request, 'register.html', {'form': form})

# Updated password reset views
def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            # Redirect directly to password reset page for the user
            return redirect('auth:set_new_password', email=email)
        except User.DoesNotExist:
            messages.error(request, 'No user is associated with this email address.')
    return render(request, 'password_reset.html')


def set_new_password(request, email):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        messages.error(request, 'Invalid email address.')
        return redirect('forgot_password')

    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        if new_password and new_password == confirm_password:
            user.set_password(new_password)
            user.save()
            messages.success(request, 'Your password has been successfully reset.')
            return redirect('auth:login')
        else:
            messages.error(request, 'The passwords do not match.')

    return render(request, 'password.html', {'email': email})

def custom_logout(request):
    logout(request)
    return redirect('auth:logged_out')

def logged_out(request):
    return render(request, 'loggedout.html')