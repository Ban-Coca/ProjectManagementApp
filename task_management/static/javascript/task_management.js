class TaskManagement{
    constructor(){
        this.tasks = [];
        this.users = [];
    }
    
    
    // function initializeTaskManagement() {
    //     // Initial tasks fetch
    //     fetchTasks();
        
    //     // Modal setup
    //     setupModal();
        
    //     // Form setup
    //     setupTaskForm();
    // }
    async initializeTaskManagement() {
        // Initial tasks fetch
        await this.fetchTasks();
        
        // Modal setup
        this.setupModal();
        
        // Form setup
        this.setupTaskForm();

        const projectId = this.getProjectIdFromUrl();
        if (projectId) {
            console.log('Project ID from URL:', projectId);
            // You can use the projectId for further processing if needed
        }
    }
    async fetchTasks() {
        await fetch('/tasks/task_list/')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch tasks');
                return response.json();
            })
            .then(data => {
                console.log('Fetched tasks:', data);
                this.tasks = data.task_list || [];
                this.renderTasks(this.tasks);
            })
            .catch(error => {
                console.error('Error fetching tasks:', error);
                Toast.show('Failed to load tasks', 'error');
            });
    }
    
    setupModal() {
        const modal = document.getElementById('addTaskModal');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const closeBtn = document.getElementsByClassName('close')[0];
    
        if (!modal || !addTaskBtn || !closeBtn) {
            console.error('Modal elements not found');
            return;
        }
    
        addTaskBtn.onclick = () => modal.style.display = "block";
        closeBtn.onclick = () => modal.style.display = "none";
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
    }
    
    setupTaskForm() {
        const addTaskForm = document.getElementById('addTaskForm');
        const modal = document.getElementById('addTaskModal');
        if (!addTaskForm) {
            console.error('Task form not found');
            return;
        }
        
        addTaskForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = this.getFormData();
            console.log('Form data:', formData);
            
            try {
                const response = await fetch('/tasks/add_task/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCookie('csrftoken')
                    },
                    body: JSON.stringify(formData)
                });
    
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to add task');
                }
    
                if (data.success) {
                    Toast.show('Task added successfully', 'success');
                    addTaskForm.reset();
                    modal.style.display = 'none';
                    this.fetchTasks(); // Refresh tasks instead of page reload
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.show(error.message, 'error');
            }
        };
    }
    
    getFormData() {
        const projectId = this.getProjectIdFromUrl();
        console.log('Project ID:', projectId);  
        return {
            project_id: projectId,
            title: document.getElementById('taskTitle')?.value,
            description: document.getElementById('taskDescription')?.value,
            status: document.getElementById('taskStatus')?.value,
            priority: document.getElementById('taskPriority')?.value,
            dueDate: document.getElementById('taskDueDate')?.value,
            assignee: document.getElementById('taskAssignee')?.value,
        };
    }
    
    renderTasks(tasks) {
        if (!Array.isArray(tasks)) {
            console.error('Expected tasks to be an array, but got:', tasks);
            return;
        }
    
        const tables = {
            TODO: document.querySelector('#todoTable tbody'),
            INPROGRESS: document.querySelector('#inProgressTable tbody'),
            DONE: document.querySelector('#doneTable tbody')
        };
    
        // Validate table elements exist
        if (!Object.values(tables).every(table => table)) {
            console.error('One or more table bodies not found');
            return;
        }
    
        // Clear existing content
        Object.values(tables).forEach(table => table.innerHTML = '');
    
        // Render tasks
        tasks.forEach(task => {
            const row = this.createTaskRow(task);
            const targetTable = tables[task.status];
            if (targetTable) {
                targetTable.appendChild(row);
            }
        });
    }
    
    createTaskRow(task) {
        const row = document.createElement('tr');
        const dueDate = this.formatDate(task.due_date);
        
        row.innerHTML = `
            <td>${this.sanitizeHTML(task.title)}</td>
            <td>${dueDate}</td>
            <td><span class="priority priority-${task.priority.toLowerCase()}">${this.sanitizeHTML(task.priority)}</span></td>
        `;
        row.id = `task-${task.id || task.task_id}`;
        row.classList.add('clickable_row');
        row.addEventListener('click', () => this.showDetails(task.task_id));
        
        return row;
    }
    
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    showDetails(taskId) {
        if (!taskId) {
            console.error('Invalid task ID');
            return;
        }
    
        fetch(`/tasks/${taskId}/`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch task details');
                return response.json();
            })
            .then(task => {
                this.renderTaskDetails(task);
                //history.pushState({ taskId: taskId }, '', `/tasks/${taskId}/`);
            })
            .catch(error => {
                console.error('Error fetching task:', error);
                Toast.show('Failed to load task details', 'error');
            });
    }
    
    
    // // EDIT TASK
    FIELD_MAPPING = {
        'task-title': 'title',
        'task-description': 'description',
        'task-status': 'status',
        'task-priority': 'priority',
        'task-due-date': 'due_date',
        'task-assignee': 'assigned_to'  // Changed from 'assignee' to match model
    };
    
    handleContentEditableChange(event, taskId) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            
            const element = event.target;
            const elementId = element.id;
            const field = FIELD_MAPPING[elementId] || elementId; // Use mapping or fallback to ID
            const value = element.textContent.trim();
            
            if (!value) {
                Toast.show('Field cannot be empty', 'error');
                element.textContent = element.dataset.originalValue;
                element.blur();
                return;
            }
            
            element.blur();
            this.saveToDatabase(taskId, field, value)
                .then(() => {
                    element.dataset.originalValue = value;
                    Toast.show('Changes saved successfully!');
                })
                .catch((error) => {
                    console.error('Save error:', error);
                    element.textContent = element.dataset.originalValue;
                    Toast.show('Failed to save changes: ' + error.message, 'error');
                });
        }
    }
    
    async saveToDatabase(taskId, field, value) {
        try {
            console.log('Saving to database:', { taskId, field, value }); // Debug log
            
            const response = await fetch(`/tasks/${taskId}/update_task/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({
                    field: field,
                    value: value
                })
            });
    
            const data = await response.json();
            console.log('Server response:', data); // Debug log
    
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
    
            if (!data.success) {
                throw new Error(data.message || 'Update was not successful');
            }
    
            await this.fetchTasks();
            return data;
        } catch (error) {
            console.error('Error details:', error);
            throw error;
        }
    }
    
    // Enhanced makeFieldsEditable function with original value tracking
    makeFieldsEditable(taskId) {
        const editableFields = document.querySelectorAll('[contenteditable="true"]');
        
        editableFields.forEach(field => {
            // Ensure field has an ID
            if (!field.id) {
                console.warn('Editable field missing ID:', field);
                return;
            }
    
            // Store original value
            field.dataset.originalValue = field.textContent.trim();
            
            // Remove existing listeners to prevent duplicates
            field.removeEventListener('keydown', field._keydownHandler);
            
            // Create new handler with taskId closure
            field._keydownHandler = (e) => this.handleContentEditableChange(e, taskId);
            field.addEventListener('keydown', field._keydownHandler);
            
            // Visual feedback
            // field.style.transition = 'all 0.2s';
            field.style.padding = '2px 4px';
            field.style.borderRadius = '3px';
    
            // Add focus effect
            field.addEventListener('focus', () => {
                // Store the value again when focusing, in case it was updated elsewhere
                field.dataset.originalValue = field.textContent.trim();
                field.style.backgroundColor = '#fff';
                field.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.25)';
            });
            
            // field.addEventListener('blur', () => {
            //     field.style.backgroundColor = 'transparent';
            //     field.style.boxShadow = 'none';
            // });
            
            // Add save on enter
            field.addEventListener('keydown', (e) => this.handleContentEditableChange(e, taskId));
        });
    }
    
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    renderTaskDetails(task) {
        console.log('Rendering task:', task);
        let modal = document.getElementById('taskDetails');
        function formattingDate(dateString) {
            const date = new Date(dateString);
          
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
          
          
            return `${day}/${month}/${year}`;  
          
        }
        const date = formattingDate(task.due_date);
        console.log(date)
        console.log(task.status)
        modal.innerHTML = ` 
    
        <div class="task-view" id="taskView">
            <div class="task-view-nav" id="task-nav">
                <div class="modal-header">
                    <button class="close-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18" stroke="#666" stroke-linecap="round"/>
                            <path d="M6 6L18 18" stroke="#666" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="delete-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H5H21" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="task-content">
                <h1 class="task-title" id="taskTitle" contenteditable="true">${task.title}</h1>
    
                <div class="field-group">
                    <span class="field-label">Assignee</span>
                    <div class="field-value">
                        <div class="avatar" id="assigneeAvatar">${task.assigned_to}</div>
                    </div>
                </div>
    
                <div class="field-group">
                    <span class="field-label">Due Date</span>
                    <div class="field-value">
                        <input type="date" id="dueDate">
                    </div>
                </div>
    
                <div class="field-group">
                    <span class="field-label">Project</span>
                    <div class="field-value">
                        <input type="text" id="project" value="${task.project_id}">
                    </div>
                </div>
    
                <div class="field-group">
                    <span class="field-label">Priority</span>
                    <div class="field-value priority-select-container">
                        <select id="prioritySelect" class="priority-select">
                            <option value="">Select priority</option>
                            <option value="low" ${task.priority === 'LOW' ? 'selected' : ''}>
                                <span class="priority-pill low">Low</span>
                            </option>
                            <option value="medium" ${task.priority === 'MEDIUM' ? 'selected' : ''}>
                                <span class="priority-pill medium">Medium</span>
                            </option>
                            <option value="high" ${task.priority === 'HIGH' ? 'selected' : ''}>
                                <span class="priority-pill high">High</span>
                            </option>
                        </select>
                    </div>
                </div>
    
                <div class="field-group">
                    <span class="field-label">Status</span>
                    <div class="field-value">
                        <select id="statusSelect" class="status-select">
                            <option class="todo" value="todo" ${task.status === 'TODO' ? 'selected' : ''}>To do</option>
                            <option class="inprog" value="in_progress" ${task.status === 'INPROGRESS' ? 'selected' : ''}>In Progress</option>
                            <option class="done" value="done" ${task.status === 'DONE' ? 'selected' : ''}>Done</option>
                        </select>
                    </div>
                </div>
    
                <div class="field-group description-group">
                    <span class="field-label">Description</span>
                    <div class="field-value">
                        <textarea class="text-area" id="description" placeholder="Add a description...">${task.description || ''}</textarea>
                    </div>
                </div>
    
                <div class="comments-section">
                    <span class="comments-title">Comments</span>
                    <textarea class="text-area" id="comments" placeholder="Add a comment..."></textarea>
                </div>
            </div>
        </div>
        `;
    
        const dueDate = modal.querySelector('#dueDate');
        dueDate.value = task.due_date;
        let content = modal.querySelector('#taskView');
        modal.style.visibility = 'visible';
    
        content.classList.add('modal-show');
        
    
        this.makeFieldsEditable(task.task_id);
    
        const closeButton = modal.querySelector('.close-button');
    
        closeButton.onclick = () => {
            modal.style.visibility = 'hidden';
            history.pushState(null, '', '/');
            content.classList.remove('modal-hide');
            content.classList.add('modal-show');
        }
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.visibility = "hidden";
                history.pushState(null, '', '/');
                content.classList.remove('modal-show');
                content.classList.add('modal-hide');
            }
        }
    
        const deleteBtn = modal.querySelector('.delete-button');
        deleteBtn.onclick = () => {
            // Check if delete modal exists, if not create it
            let deleteModal = document.getElementById('deleteModal');
            if (!deleteModal) {
                deleteModal = document.createElement('div');
                deleteModal.id = 'deleteModal';
                deleteModal.className = 'modal';
                deleteModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-head">
                            <h2>Delete Task "${task.title}"</h2>
                            <span class="close">&times;</span>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this task ? This action cannot be undone.</p>
                        </div>
                        <div class="modal-footer">
                            <button id="cancelDeleteTaskBtn" class="button secondary">Cancel</button>
                            <button id="deleteTaskBtn" class="button danger">Delete</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(deleteModal);
            }
            
            deleteModal.style.display = 'block';
            
            const deleteTaskBtn = document.getElementById('deleteTaskBtn');
            const cancelTaskBtn = document.getElementById('cancelDeleteTaskBtn');
            const closeBtn = deleteModal.querySelector('.close');
        
            // Clear any existing event listeners
            deleteTaskBtn.replaceWith(deleteTaskBtn.cloneNode(true));
            cancelTaskBtn.replaceWith(cancelTaskBtn.cloneNode(true));
            
            // Get the fresh references after cloning
            const newDeleteTaskBtn = document.getElementById('deleteTaskBtn');
            const newCancelTaskBtn = document.getElementById('cancelDeleteTaskBtn');
            
            // Add new event listeners
            newDeleteTaskBtn.onclick = () => {
                this.deleteTask(task);
                deleteModal.style.display = 'none';
                modal.style.visibility = 'hidden'; // Close the task details modal
            };
        
            newCancelTaskBtn.onclick = () => {
                deleteModal.style.display = 'none';
            };
        
            closeBtn.onclick = () => {
                deleteModal.style.display = 'none';
            };
        
            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target == deleteModal) {
                    deleteModal.style.display = 'none';
                }
            };
        };
    
    }
    
    
    
    // // DELETE TASK
    deleteTask(task){
        const crsfToken = this.getCookie('csrftoken');
        fetch(`/tasks/${task.task_id}/delete_task/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': crsfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                Toast.show('Task deleted successfully', 'success');
                this.fetchTasks();
            }
        })
        .catch(error => console.error('Error:', error));
    }
    
    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    getProjectIdFromUrl() {
        const url = window.location.pathname;
        const regex = /\/projects\/(\d+)\//;
        const match = url.match(regex);
        console.log('Match:', match);
        return match ? match[1] : null;
    }
}

class Toast {
    
    static show(message, type = 'success') {
        const existingToast = document.getElementById('toastNotification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);

        if (type === 'success') {
            const taskManagement = new TaskManagement();
            taskManagement.fetchTasks(); // Refresh data instead of page reload
        }
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Consolidate duplicate DOMContentLoaded listeners
    // initializeTaskManagement();
    const taskManagement = new TaskManagement();
    taskManagement.initializeTaskManagement();
    window.taskManagement = taskManagement;
});