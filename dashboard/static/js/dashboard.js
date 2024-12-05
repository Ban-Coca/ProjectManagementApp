let selectedProjectId = 'all'; // Define selectedProjectId globally

document.addEventListener('DOMContentLoaded', function() {
    initializeProjectDropdown();
    initializeDragAndDrop();
    initializeButtons();
    initializeCharts();
});

// Project dropdown functionality
function initializeProjectDropdown() {
    const dropdownBtn = document.getElementById('projectDropdown');
    const dropdownContent = document.getElementById('projectList');
    
    // Set default selection to "All Projects" on page load
    dropdownBtn.textContent = 'All Projects ▾';  // Set the text to "All Projects"
    dropdownBtn.setAttribute('data-selected-project-id', 'all');  // Set the default project ID as 'all'
    
    // Fetch task data for "All Projects" when the page loads
    updateProjectTasks('all');  // Call the function with 'all' to get task data for all projects

    if (dropdownBtn && dropdownContent) {
        // Toggle dropdown when clicking the button
        dropdownBtn.addEventListener('click', function(event) {
            event.preventDefault();
            dropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', function(event) {
            if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove('show');
            }
        });

        // Delegate event for project items to avoid repetitive event listeners
        dropdownContent.addEventListener('click', function(event) {
            if (event.target && event.target.classList.contains('dropdown-item')) {
                event.preventDefault();
        
                // Update selected project ID
                selectedProjectId = event.target.getAttribute('data-project-id') || 'all';
                const projectName = event.target.textContent.trim();
        
                // Update dropdown button text
                dropdownBtn.textContent = projectName + ' ▾';
                dropdownBtn.setAttribute('data-selected-project-id', selectedProjectId);
        
                // Hide the dropdown menu
                dropdownContent.classList.remove('show');
        
                console.log('Selected project ID:', selectedProjectId);
        
                // Refresh task placeholders
                updateProjectTasks(selectedProjectId);
        
                // Refresh charts
                refreshAllCharts(selectedProjectId);
            }
        });
    }
}

// Function to fetch updated task counts from the server
function updateProjectTasks(projectId) {
    if (!projectId) {
        projectId = 'all';
    }

    const todoPlaceholder = document.querySelector('.to-do');
    const inProgressPlaceholder = document.querySelector('.in-progress');
    const completedPlaceholder = document.querySelector('.completed');

    if (todoPlaceholder && inProgressPlaceholder && completedPlaceholder) {
        todoPlaceholder.classList.add('card-refreshing');
        inProgressPlaceholder.classList.add('card-refreshing');
        completedPlaceholder.classList.add('card-refreshing');
    }

    fetch(`/dashboard/?project_id=${projectId}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        setTimeout(() => {
            if (todoPlaceholder && inProgressPlaceholder && completedPlaceholder) {
                todoPlaceholder.textContent = data.to_do_tasks || 0;
                inProgressPlaceholder.textContent = data.in_progress_tasks || 0;
                completedPlaceholder.textContent = data.completed_tasks || 0;

                todoPlaceholder.classList.remove('card-refreshing');
                inProgressPlaceholder.classList.remove('card-refreshing');
                completedPlaceholder.classList.remove('card-refreshing');
            }
        }, 500);
    })
    .catch(error => {
        console.error('Error fetching task data:', error);
        setTimeout(() => {
            if (todoPlaceholder && inProgressPlaceholder && completedPlaceholder) {
                todoPlaceholder.textContent = 'Error';
                inProgressPlaceholder.textContent = 'Error';
                completedPlaceholder.textContent = 'Error';

                todoPlaceholder.classList.remove('card-refreshing');
                inProgressPlaceholder.classList.remove('card-refreshing');
                completedPlaceholder.classList.remove('card-refreshing');
            }
        }, 500);
    });
}

// Add event listeners for the refresh icons
document.getElementById('refreshToDo').addEventListener('click', function(event) {
    event.preventDefault();
    updateProjectTasks(selectedProjectId || 'all');
});

document.getElementById('refreshInProgress').addEventListener('click', function(event) {
    event.preventDefault();
    updateProjectTasks(selectedProjectId || 'all');
});

document.getElementById('refreshCompleted').addEventListener('click', function(event) {
    event.preventDefault();
    updateProjectTasks(selectedProjectId || 'all');
});

// Refresh all charts and task counts
function refreshAllCharts(projectId) {
    refreshChart('taskStatusChartCard',projectId);
    refreshChart('totalTasksPerProjectChartCard',projectId);
    updateProjectTasks(projectId);
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.stat-card, .chart-card');
    let draggedItem = null;

    cards.forEach(card => {
        card.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        card.addEventListener('dragend', function() {
            draggedItem = null;
            this.style.opacity = '1';
        });

        card.addEventListener('dragover', function(event) {
            event.preventDefault();
        });

        card.addEventListener('drop', function() {
            if (draggedItem && this !== draggedItem) {
                const parent = this.parentNode;
                const allCards = [...parent.children];
                const draggedPos = allCards.indexOf(draggedItem);
                const droppedPos = allCards.indexOf(this);
                if (draggedPos < droppedPos) {
                    parent.insertBefore(draggedItem, this.nextSibling);
                } else {
                    parent.insertBefore(draggedItem, this);
                }
            }
        });
    });
}

function initializeButtons() {
    const moreOptionsButtons = document.querySelectorAll('.more-options-btn');
    moreOptionsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.options-dropdown');
        dropdowns.forEach(dropdown => dropdown.style.display = 'none');
    });

    const refreshButtons = document.querySelectorAll('.refresh-icon');
    refreshButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            const card = this.closest('.stat-card, .chart-card');
            if (card) {
                card.classList.add('card-refreshing');
                setTimeout(() => {
                    if (card.classList.contains('chart-card')) {
                        const cardId = card.querySelector('canvas').id;
                        refreshChart(cardId);
                    } else if (card.classList.contains('stat-card')) {
                        updateProjectTasks(selectedProjectId);
                    }
                    card.classList.remove('card-refreshing');
                }, 500); // Delay of 500ms
            }
        });
    });
}

document.getElementById('refreshTaskStatusChart').addEventListener('click', () => {
    const card = document.querySelector('#taskStatusChartCard');
    if (card) {
        card.classList.add('card-refreshing');
        setTimeout(() => {
            refreshChart('taskStatusChartCard');
            card.classList.remove('card-refreshing');
        }, 500); // Delay of 500ms
    }
});

document.getElementById('refreshTaskStatusChart').addEventListener('click', () => refreshChart('taskStatusChartCard'));
document.getElementById('refreshtotalTasksPerProjectChart').addEventListener('click', () => refreshChart('totalTasksPerProjectChartCard'));

// Modify refreshChart to accept data and refresh the chart
function refreshChart(chartId, projectId) {
    const card = document.querySelector(`#${chartId}`);
    if (card) {
        card.classList.add('card-refreshing');
        setTimeout(() => {
            if (chartId === 'taskStatusChartCard') {
                if (taskStatusChartInstance) {
                    taskStatusChartInstance.destroy();
                }
                taskStatusChartInstance = initializeChart('taskStatusChart', projectId, 'doughnut', (data) => ({
                    labels: ['To-Do', 'In Progress', 'Done'],
                    datasets: [{
                        label: 'Task Status',
                        data: [data.to_do_tasks, data.in_progress_tasks, data.completed_tasks],
                        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0'],
                    }]
                }));
            } else if (chartId === 'totalTasksPerProjectChartCard') {
                if (totalTasksPerProjectChartInstance) {
                    totalTasksPerProjectChartInstance.destroy();
                }
                totalTasksPerProjectChartInstance = initializeChart('totalTasksPerProjectChart', projectId, 'bar', (data) => ({
                    labels: data.project_titles,
                    datasets: [{
                        label: 'Overall Tasks',
                        data: data.total_tasks,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                }));
            }
            card.classList.remove('card-refreshing');
        }, 500);
    }
}

// Global chart instances (ensure they're declared globally)
let taskStatusChartInstance = null;
let totalTasksPerProjectChartInstance = null;

// Reusable chart initialization function
function initializeChart(chartId, projectId, chartType, chartData) {
    if (!projectId) {
        projectId = 'all';
    }
    
    console.log('Fetching task data for project in chart GET:', projectId);
    
    let url = '/dashboard/';
        
    if (projectId && projectId !== 'all') {
        url += `?project_id=${projectId}`;
    }
    
    fetch(url, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data) {
            const ctx = document.getElementById(chartId).getContext('2d');
                
                // Check if the chart already exists and destroy it before creating a new one
                if (chartId === 'taskStatusChart' && taskStatusChartInstance) {
                    taskStatusChartInstance.destroy();
                } else if (chartId === 'totalTasksPerProject' && totalTasksPerProjectChartInstance) {
                    totalTasksPerProjectChartInstance.destroy();
                }

                // Create the new chart instance
                const chartInstance = new Chart(ctx, {
                    type: chartType,
                    data: chartData(data),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: chartId.replace(/([A-Z])/g, ' $1').toUpperCase() }
                        }
                    }
                });
                console.log('Project Titles:', data.project_titles);
                console.log('Total Tasks:', data.total_tasks);
                console.log('Data in Overall Chart:', data);
                // Assign the chart instance to the global variable
                if (chartId === 'taskStatusChart') {
                    taskStatusChartInstance = chartInstance;
                } else if (chartId === 'totalTasksPerProjectChart') {
                    totalTasksPerProjectChartInstance = chartInstance;
                }
        }
    })
    .catch(error => console.error('Error fetching task data:', error));
}

function initializeCharts(projectId) {

    initializeChart('taskStatusChart', projectId, 'doughnut', (data) => ({
        text: "Total Tasks Per Project",
        labels: ['To-Do', 'In Progress', 'Done'],
        datasets: [{
            label: 'Task Status',
            data: [data.to_do_tasks, data.in_progress_tasks, data.completed_tasks],
            backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0'],
        }]
    }));

    initializeChart('totalTasksPerProjectChart', projectId, 'bar', (data) => ({
        labels: data.project_titles,
        datasets: [{
            label: 'Overall Tasks',
            data: data.total_tasks,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    }));
}