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

    const tbody = document.querySelector('#taskTable tbody');
    if (!tbody) {
        console.error('Could not find tbody element in the table');
        return;
    }

    tbody.innerHTML = '';
    tasks.forEach(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A';
        const row = `
            <tr>
                <td>${task.title}</td>
                <td>${task.description}</td>
                <td>${task.status}</td>
                <td><span class="priority priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td>${dueDate}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // Fetch tasks from backend
    fetch('/tasks/')
        .then(response => response.json())
        .then(data => {
            tasks = data;
            renderTasks();
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
            dueDate: document.getElementById('taskDueDate').value
        };
        
        fetch('/api/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(newTask)
        })
        .then(response => response.json())
        .then(data => {
            tasks.push(data);
            renderTasks();
            modal.style.display = "none";
            addTaskForm.reset();
        })
        .catch(error => console.error('Error:', error));
    }

    // document.getElementById('searchBtn').addEventListener('click', () => {
    //     const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    //     const filteredTasks = tasks.filter(task => 
    //         task.title.toLowerCase().includes(searchTerm) || 
    //         task.description.toLowerCase().includes(searchTerm)
    //     );
    //     renderFilteredTasks(filteredTasks);
    // });

    document.getElementById('filterBtn').addEventListener('click', () => {
        alert('Filter functionality would be implemented here');
        // In a real app, this would open a filter modal or dropdown
    });
});
