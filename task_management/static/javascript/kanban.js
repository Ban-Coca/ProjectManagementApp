class KanbanBoard {
    constructor() {
        this.boardElement = document.getElementById('kanban-board');
        this.draggedCard = null;
        this.columns = {
            'TODO': { name: 'To Do', tasks: [] },
            'INPROGRESS': { name: 'In Progress', tasks: [] },
            'DONE': { name: 'Done', tasks: [] }
        };
        this.init();
    }

    async init() {
        await this.loadTasks();
        this.setupEventListeners();
        this.setupModal();
        this.setupTaskForm();
    }

    async loadTasks() {
        try {
            const response = await fetch('/tasks');
            const data = await response.json();
            console.log(data);
            // Reset columns
            Object.keys(this.columns).forEach(status => {
                this.columns[status].tasks = [];
            });

            // Distribute tasks to columns
            data.task_list.forEach(task => {
                if (this.columns[task.status]) {
                    this.columns[task.status].tasks.push(task);
                }
            });

            this.renderBoard();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        Object.entries(this.columns).forEach(([status, column]) => {
            const columnElement = this.createColumn(status, column);
            this.boardElement.appendChild(columnElement);
        });
    }

    createColumn(status, column) {
        const columnElement = document.createElement('div');
        columnElement.className = 'column';
        columnElement.dataset.status = status;

        const header = document.createElement('div');
        header.className = 'column-header';
        header.innerHTML = `
            ${column.name}
            <span class="column-count">${column.tasks.length}</span>
        `;

        columnElement.appendChild(header);

        column.tasks.forEach(task => {
            const cardElement = this.createCard(task);
            columnElement.appendChild(cardElement);
        });

        return columnElement;
    }

    createCard(task) {
        const cardElement = document.createElement('div');
        cardElement.className = 'task-card';
        cardElement.draggable = true;
        cardElement.dataset.taskId = task.task_id;

        cardElement.innerHTML = `
            <div class="task-header">
                <span class="task-id">${task.task_id}</span>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
            </div>
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>
            <div class="task-metadata">
                <span>Due: ${task.due_date}</span>
                <span>Assignee: ${task.assigned_to}</span>
            </div>
        `;

        return cardElement;
    }

    setupModal() {
        const modal = document.getElementById('addTaskModal');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const closeBtn = document.getElementsByClassName('close')[0];
        console.log("open ngari atay")
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
            const formData = getFormData();
            
            try {
                const response = await fetch('/tasks/add_task/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
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
                    this.loadTasks(); // Refresh tasks instead of page reload
                }
            } catch (error) {
                console.error('Error:', error);
                Toast.show(error.message, 'error');
            }
        };
    }

    setupEventListeners() {
        this.boardElement.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                this.draggedCard = e.target;
                e.target.classList.add('dragging');
            }
        });

        this.boardElement.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
                this.draggedCard = null;
                document.querySelectorAll('.column').forEach(column => {
                    column.classList.remove('drag-over');
                });
            }
        });

        this.boardElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            const column = e.target.closest('.column');
            if (column) {
                column.classList.add('drag-over');
            }
        });

        this.boardElement.addEventListener('dragleave', (e) => {
            const column = e.target.closest('.column');
            if (column) {
                column.classList.remove('drag-over');
            }
        });

        this.boardElement.addEventListener('drop', async (e) => {
            e.preventDefault();
            const column = e.target.closest('.column');
            if (column && this.draggedCard) {
                const newStatus = column.dataset.status;
                const taskId = this.draggedCard.dataset.taskId;
                
                try {
                    await this.updateTaskStatus(taskId, newStatus);
                    // Reload the board to ensure consistency
                    await this.loadTasks();
                } catch (error) {
                    console.error('Error updating task status:', error);
                }
            }
        });
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            const response = await fetch(`/tasks/${taskId}/update_task/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field: 'status',
                    value: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

// Initialize the Kanban board when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const board = new KanbanBoard();
});

const Toast = {
    show(message, type = 'success') {
        const existingToast = document.getElementById('toastNotification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
                if (type === 'success') {
                    fetchTasks(); // Refresh data instead of page reload
                }
            }, 300);
        }, 2000);
    }
};

function getFormData() {
    return {
        title: document.getElementById('taskTitle')?.value,
        description: document.getElementById('taskDescription')?.value,
        status: document.getElementById('taskStatus')?.value,
        priority: document.getElementById('taskPriority')?.value,
        dueDate: document.getElementById('taskDueDate')?.value,
        assignee: document.getElementById('taskAssignee')?.value
    };
}

function getCookie(name) {
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