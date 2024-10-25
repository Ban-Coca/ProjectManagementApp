from django.shortcuts import render, redirect
from .forms import SignUpForm, CustomAuthenticationForm
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.contrib import messages
from django.conf import settings
from django.db import transaction
from django.template.loader import render_to_string

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                auth_login(request, user)
                return redirect('home')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'login.html', {'form': form})

def register(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        try:
            with transaction.atomic():
                if form.is_valid():
                    # Create the user but don't save to DB yet
                    user = form.save(commit=False)
                    
                    # Add any additional fields
                    user.first_name = form.cleaned_data.get('first_name')
                    user.last_name = form.cleaned_data.get('last_name')
                    
                    # Save the user to the database
                    user.save()
                    
                    # Get the raw password to authenticate
                    raw_password = form.cleaned_data.get('password1')
                    
                    # Authenticate and login the user
                    user = authenticate(username=user.username, password=raw_password)
                    if user is not None:
                        auth_login(request, user)
                        messages.success(request, 'Registration successful!')
                        print("Registration successful!")  # For debugging
                        return redirect('login')
                    else:
                        messages.error(request, 'Failed to authenticate after registration.')
                else:
                    for field, errors in form.errors.items():
                        for error in errors:
                            messages.error(request, f"{field}: {error}")
        except Exception as e:
            messages.error(request, f'Registration failed: {str(e)}')
            print(f"Registration error: {str(e)}")  # For debugging
    else:
        form = SignUpForm()
    return render(request, 'register.html', {'form': form})

def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            subject = 'Password Reset Requested'
            email_template_name = 'password_reset_email.html'  # Email template name
            context = {
                'email': user.email,
                'domain': request.META['HTTP_HOST'],
                'site_name': 'Your Site Name',  # Customize your site name
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
                'protocol': 'http',
            }
            email = render_to_string(email_template_name, context) # type: ignore
            send_mail(subject, email, settings.DEFAULT_FROM_EMAIL, [user.email])
            messages.success(request, 'A link to reset your password has been sent to your email.')
            return redirect('login')
        except User.DoesNotExist:
            messages.error(request, 'No user is associated with this email address.')
    return render(request, 'password_reset.html')  # Render the password reset template

