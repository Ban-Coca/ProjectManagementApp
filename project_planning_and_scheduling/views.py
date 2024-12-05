# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.http import JsonResponse
from django.db import transaction
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from .models import Project, ProjectMember
from django.core.exceptions import ObjectDoesNotExist
from task_management.models import Tasks
import logging
import json
import uuid
User = get_user_model()
logger = logging.getLogger(__name__)

@login_required
def projects_list(request):
    # Get projects where user is owner
    owned_projects = Project.objects.filter(owner=request.user)
    
    # Get projects where user is a member
    member_projects = Project.objects.filter(projectmember__user=request.user)
    
    # Combine and remove duplicates
    projects = (owned_projects | member_projects).distinct()
    
    return render(request, 'project_page/project_list.html', {'projects': projects})

@login_required
def create_project(request):
    if request.method == 'POST':
        title = request.POST.get('projectTitle')
        description = request.POST.get('projectDescription')
        deadline = request.POST.get('projectDeadline')
        
        start_date = timezone.now().date()

        if not title or not description or not deadline:
            return JsonResponse({"error": "All fields are required."}, status=400)

        try:
            deadline = timezone.datetime.strptime(deadline, "%Y-%m-%d").date()
            if deadline <= start_date:
                return JsonResponse({"error": "The end date must be after the start date."}, status=400)
        except ValueError:
            return JsonResponse({"error": "Invalid date format."}, status=400)

        try:
            with transaction.atomic():
                new_project = Project(
                    title=title,
                    description=description,
                    start_date=start_date,
                    end_date=deadline,
                    owner=request.user,
                    status='To Do'  # Changed to match your model's STATUS choices
                )
                new_project.save()

                # Create ProjectMember entry for owner
                ProjectMember.objects.create(
                    project=new_project,
                    user=request.user,
                    role='Owner'  # Changed to match your model's ROLE_CHOICES
                )

            return redirect('project_planning_and_scheduling:projects_list')
        
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except Exception as ex:
            return JsonResponse({"error": "An unexpected error occurred: " + str(ex)}, status=500)

    return redirect('project_planning_and_scheduling:projects_list')

@login_required
def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    
    tasks = Tasks.objects.filter(project=pk)
    # Check if user has access to this project
    if not (project.owner == request.user or 
            ProjectMember.objects.filter(project=project, user=request.user).exists()):
        return JsonResponse({"error": "Access denied"}, status=403)
    
    # Get all project members
    members = ProjectMember.objects.filter(project=project).select_related('user')
    
    context = {
        'project': project,
        'members': members,
        'is_owner': project.owner == request.user,
        'tasks': tasks
    }
    
    return render(request, 'project_page/project_details.html', context)

@login_required
def delete_project(request, pk):
    if request.method == 'DELETE':
        project = get_object_or_404(Project, pk=pk)
        
        # Check if user has permission to delete
        if project.owner != request.user:
            return JsonResponse({"error": "Permission denied"}, status=403)
            
        project.delete()
        return JsonResponse({'message': 'Project deleted successfully.'}, status=204)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def update_project(request, pk):
    project = get_object_or_404(Project, id=pk)

    if request.method == 'GET':
        # Return project details as JSON
        project_data = {
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'end_date': project.end_date.strftime('%Y-%m-%d')
        }
        return JsonResponse(project_data)

    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            project.title = data.get('title', project.title)
            project.description = data.get('description', project.description)
            project.status = data.get('status', project.status)
            project.end_date = data.get('end_date', project.end_date)
            project.save()
            return JsonResponse({'message': 'Project updated successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

@login_required
def search_users(request, project_id):
    try:
        # Get the project, ensuring current user has access
        project = get_object_or_404(Project, id=project_id)
        
        query = request.GET.get('q', '').strip()
        
        # Get IDs of existing project members
        existing_member_ids = ProjectMember.objects.filter(
            project=project
        ).values_list('user_id', flat=True)
        
        # Base queryset excluding existing members
        users_queryset = User.objects.exclude(
            user_id__in=existing_member_ids
        )
        
        # Search if query provided
        if query:
            users = users_queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            ).distinct()[:10]
        else:
            users = users_queryset.none()
        
        # Serialize user data
        users_data = [{
            'id': str(user.user_id),  # Use user_id instead of id
            'username': user.username,
            'email': user.email,
            'full_name': f"{user.first_name} {user.last_name}".strip()
        } for user in users]
        
        return JsonResponse(users_data, safe=False)
    
    except Exception as e:
        logger.error(f"User search error: {e}", exc_info=True)
        return JsonResponse({
            "error": "Search failed", 
            "details": str(e)
        }, status=500)

@login_required
def get_project_members(request, project_id):
    try:
        project = get_object_or_404(Project, id=project_id)
        
        # Ensure current user has access to view members
        if project.owner != request.user:
            return JsonResponse({"error": "Permission denied"}, status=403)
        
        members = ProjectMember.objects.filter(project=project)
        
        members_data = [{
            'id': str(member.user.user_id),
            'username': member.user.username,
            'email': member.user.email,
            'role': member.role,
            'full_name': f"{member.user.first_name} {member.user.last_name}".strip()
        } for member in members]
        
        return JsonResponse(members_data, safe=False)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
@csrf_exempt
def add_member_to_project(request, project_id):
    if request.method == "POST":
        try:
            # Get the project
            project = get_object_or_404(Project, id=project_id)

            # Get the user_id from the request body (assuming it's JSON)
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            logger.info(f"Received user_id: {user_id}, type: {type(user_id)}")

            try:
                validated_uuid = uuid.UUID(str(user_id))
                logger.info(f"Validated UUID: {validated_uuid}")
            except (ValueError, TypeError) as e:
                logger.error(f"UUID Validation Error: {e}")
                return JsonResponse({"error": f"Invalid user ID format: {str(e)}"}, status=400)
            
            if not user_id:
                return JsonResponse({"error": "User ID is required"}, status=400)

            try:
                # Retrieve the user by user_id (not id)
                user = get_user_model().objects.get(user_id=user_id)
            except get_user_model().DoesNotExist:
                return JsonResponse({"error": "No User matches the given query."}, status=404)

            # Check if the user is already a member of the project
            if project.is_member(user):
                return JsonResponse({"error": "User is already a member of this project."}, status=400)

            # Add user as member
            ProjectMember.objects.create(project=project, user=user, role="Member")

            return JsonResponse({"message": "User added successfully"})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

@login_required
@csrf_exempt
def remove_member(request, project_id):
    if request.method == 'DELETE':
        data = json.loads(request.body)
        user_id = data.get('user_id')
        
        try:
            # Retrieve the project and user
            project = Project.objects.get(id=project_id)
            user = User.objects.get(user_id=user_id)
            
            # Ensure the user is not the project owner
            if user == project.owner:
                return JsonResponse({'error': 'Cannot remove the project owner'}, status=400)
            
            # Find the ProjectMember instance and delete it
            project_member = ProjectMember.objects.filter(project=project, user=user).first()
            
            if project_member:
                project_member.delete()  # Remove the user from the project
                return JsonResponse({'message': 'User removed successfully'}, status=200)
            else:
                return JsonResponse({'error': 'User not part of the project'}, status=404)
        
        except Project.DoesNotExist:
            return JsonResponse({'error': 'Project not found'}, status=404)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)
    
def is_owner(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
        is_owner = project.owner == request.user
        return JsonResponse({'is_owner': is_owner, 'owner_id': project.owner.id})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Project not found'}, status=404)