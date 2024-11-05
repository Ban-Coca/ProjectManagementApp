# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.http import JsonResponse
from django.db import transaction
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from .models import Project, ProjectMember
import json

User = get_user_model()

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

"""""
# New views for member management
@login_required
def get_project_members(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user has access to view members
    if not (project.owner == request.user or 
            ProjectMember.objects.filter(project=project, user=request.user).exists()):
        return JsonResponse({"error": "Access denied"}, status=403)
    
    members = ProjectMember.objects.filter(project=project).select_related('user')
    
    members_data = [{
        'id': member.user.id,
        'username': member.user.username,
        'role': member.role,
        'email': member.user.email
    } for member in members]
    
    # Add owner if not in members list
    if not any(m['id'] == project.owner.id for m in members_data):
        members_data.insert(0, {
            'id': project.owner.id,
            'username': project.owner.username,
            'role': 'OWNER',
            'email': project.owner.email
        })
    
    return JsonResponse(members_data, safe=False)

@login_required
def search_users(request, project_id):
    query = request.GET.get('q', '')
    if not query:
        return JsonResponse([], safe=False)
        
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user has permission to add members
    if project.owner != request.user:
        return JsonResponse({"error": "Permission denied"}, status=403)
    
    # Get existing member IDs
    existing_member_ids = ProjectMember.objects.filter(project=project).values_list('user_id', flat=True)
    
    # Search for users not in project
    users = User.objects.exclude(
        Q(id__in=existing_member_ids) | Q(id=project.owner.id)
    ).filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    )[:10]
    
    users_data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email
    } for user in users]
    
    return JsonResponse(users_data, safe=False)

@login_required
def add_project_member(request, project_id):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user has permission to add members
    if project.owner != request.user:
        return JsonResponse({"error": "Permission denied"}, status=403)
    
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        role = data.get('role', 'MEMBER')  # Default to MEMBER role
        
        if role not in [choice[0] for choice in ProjectMember.ROLE_CHOICES]:
            return JsonResponse({"error": "Invalid role"}, status=400)
        
        user = User.objects.get(id=user_id)
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=project, user=user).exists():
            return JsonResponse({"error": "User is already a member"}, status=400)
            
        member = ProjectMember.objects.create(
            project=project,
            user=user,
            role=role
        )
        
        return JsonResponse({
            'message': 'Member added successfully',
            'member': {
                'id': user.id,
                'username': user.username,
                'role': member.role,
                'email': user.email
            }
        })
        
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
"""