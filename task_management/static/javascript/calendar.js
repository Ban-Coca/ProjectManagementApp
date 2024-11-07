class TaskCalendar {
    constructor() {
        this.calendar = null;
        this.tasks = [];
    }

    init() {
        this.initializeCalendar();
        this.fetchTasks();
    }

    getProjectIdFromUrl() {
        const url = window.location.pathname;
        const regex = /\/projects\/(\d+)\//;
        const match = url.match(regex);
        console.log('Match:', match);
        return match ? match[1] : null;
    }

    async fetchTasks() {
        const projectId = this.getProjectIdFromUrl();
        if (!projectId) {
            console.error('Project ID not found in URL');
            return;
        }

        try {
            const response = await fetch(`/tasks/list_by_project/${projectId}/`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            
            const data = await response.json();
            console.log('Fetched tasks:', data);
            
            this.tasks = data.task_list || [];
            this.renderCalendarEvents();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            editable: false,// Disable drag and drop
            height: '100%',  // Changed from 'auto' to '100%'
            eventDidMount: (info) => {
                // Initialize tooltips for events
                tippy(info.el, {
                    content: this.generateTooltipContent(info.event),
                    placement: 'top',
                    arrow: true,
                    theme: 'light-border',
                    allowHTML: true,
                    
                });
            }
        });

        this.calendar.render();
    }

    generateTooltipContent(event) {
        const task = event.extendedProps;
        return `
            <div class="task-tooltip">
                <h4>${event.title}</h4>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <div class="task-meta">
                    <span class="status ${task.status}">${task.status}</span>
                    <span class="priority ${task.priority}">${task.priority}</span>
                </div>
                ${task.assignee ? `<div class="assignee">Assigned to: ${task.assignee}</div>` : ''}
            </div>
        `;
    }

    renderCalendarEvents() {
        // Remove existing events
        this.calendar.removeAllEvents();

        // Convert tasks to calendar events
        const events = this.tasks.map(task => ({
            id: task.task_id,
            title: task.title,
            start: task.due_date,
            className: `priority-${task.priority.toLowerCase()}`,
            extendedProps: {
                description: task.description,
                status: task.status,
                assignee: task.assignee,
                priority: task.priority
            }
        }));

        this.calendar.addEventSource(events);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const taskCalendar = new TaskCalendar();
    document.querySelector('[data-tab="calendarTab"]').addEventListener('click', () => {
        if (!taskCalendar.calendar) {  // Ensure it's only initialized once
            taskCalendar.init();
        }
    });
    
});

