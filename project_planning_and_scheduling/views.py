from django.shortcuts import render, redirect
from django.core.exceptions import ValidationError
from .models import Project, Task, ProjectMember
from django.utils import timezone
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST

def home(request):
    projects = Project.objects.all()  # Fetching all projects
    return render(request, 'home.html', {'projects': projects})

def projects_list(request):
    projects = Project.objects.all()  # Fetching all projects
    return render(request, 'project_page/project_list.html', {'projects': projects})

def create_project(request):
    # Check if the request method is POST
    if request.method == 'POST':
        title = request.POST.get('projectTitle')
        description = request.POST.get('projectDescription')
        deadline = request.POST.get('projectDeadline')

        # Validate that the end_date is after start_date
        start_date = timezone.now().date()  # You can adjust this logic if needed

        if not title or not description or not deadline:
            return JsonResponse({"error": "All fields are required."}, status=400)

        # Convert deadline to a date object
        try:
            deadline = timezone.datetime.strptime(deadline, "%Y-%m-%d").date()
            if deadline <= start_date:
                return JsonResponse({"error": "The end date must be after the start date."}, status=400)
        except ValueError:
            return JsonResponse({"error": "Invalid date format."}, status=400)

        try:
            # Set a default user if none exist
            default_user = User.objects.first()  # Get the first user if exists
            if default_user is None:
                default_user = User(username='temp_user', password='temp_password')
                default_user.save()

            new_project = Project(
                title=title,
                description=description,
                start_date=start_date,
                end_date=deadline,
                owner=default_user,  # Set the owner to the default user
                status='In Progress'
            )
            new_project.save()
            return redirect('projects_list')  # Redirect to home after successful creation
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except Exception as ex:
            return JsonResponse({"error": "An unexpected error occurred: " + str(ex)}, status=500)
    
    # If it's a GET request (including refresh), redirect to home
    return redirect('projects_list')

def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    return render(request, 'project_page/project_details.html', {'project': project})

def delete_project(request, pk):
    if request.method == 'DELETE':
        project = get_object_or_404(Project, pk=pk)
        project.delete()
        return JsonResponse({'message': 'Project deleted successfully.'}, status=204)  # No Content
    return JsonResponse({'error': 'Invalid request'}, status=400)