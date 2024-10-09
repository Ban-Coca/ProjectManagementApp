document.addEventListener('DOMContentLoaded', () => {
    // Fetch tasks from backend
    fetch('/tasks/')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched tasks:', data);
            if (data.task_list && Array.isArray(data.task_list)) {
                renderTasks(data.task_list);
            } else {
                console.error('Expected an array of tasks, but got:', data);
            }
        })
        .catch(error => console.error('Error:', error));
})

function renderTasks(tasks) {
    if (!Array.isArray(tasks)) {
        console.error('Expected tasks to be an array, but got:', tasks);
        return;
    }

    const todoTableBody = document.querySelector('#todoTable tbody');
    const inProgressTableBody = document.querySelector('#inProgressTable tbody');
    const doneTableBody = document.querySelector('#doneTable tbody');

    if (!todoTableBody || !inProgressTableBody || !doneTableBody) {
        console.error('Could not find tbody element in the table');
        return;
    }

    todoTableBody.innerHTML = '';
    inProgressTableBody.innerHTML = '';
    doneTableBody.innerHTML = '';

    tasks.forEach(task => {
        const dueDate = formatDate(task.due_date);
        
        const row = document.createElement('tr');
        row.innerHTML = `
                <td>${task.title}</td>
                <td>${task.description}</td>
                <td><span class="priority priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td>${dueDate}</td>
            `;
        row.id = `task-${task.id}`;
        row.addEventListener('click', () => {
            window.location.href = `/tasks/${task.id}/`;
        })
        if(task.status === 'TODO') {
            todoTableBody.appendChild(row);
        } else if(task.status === 'INPROGRESS') {
            inProgressTableBody.appendChild(row);
        } else if(task.status === 'DONE') {
            doneTableBody.appendChild(row);
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // Fetch tasks from backend
    fetch('/tasks/')
        .then(response => response.json())
        .then(data => {
            tasks = data;
            renderTasks(tasks);
        });

    const modal = document.getElementById('addTaskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const closeBtn = document.getElementsByClassName('close')[0];
    const addTaskForm = document.getElementById('addTaskForm');

    addTaskBtn.onclick = () => {
        modal.style.display = "block";
    }

    closeBtn.onclick = () => {
        modal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    addTaskForm.onsubmit = (e) => {
        e.preventDefault();
        const newTask = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            assignee: document.getElementById('taskAssignee').value
        };
        
        fetch('/tasks/add_task/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                alert('Task added successfully');
                document.getElementById('addTaskForm').reset();
                document.getElementById('addTaskModal').style.display = 'none';
                
                location.reload();
            }
        })
        .catch(error => console.error('Error:', error));
    }
});

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
