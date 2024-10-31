// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProjectDropdown();
    initializeDragAndDrop();
    initializeButtons();
});

// Project dropdown functionality
function initializeProjectDropdown() {
    const dropdownBtn = document.getElementById('projectDropdown');
    const dropdownContent = document.getElementById('projectList');

    if (dropdownBtn && dropdownContent) {
        // Toggle dropdown when clicking the button
        dropdownBtn.addEventListener('click', function(event) {
            event.preventDefault();
            dropdownContent.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', function(event) {
            // Check if the click is outside the dropdown button and dropdown content
            if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target)) {
                dropdownContent.classList.remove('show');
            }
        });

        // Update button text to show selected project
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project_id');
        if (projectId) {
            const activeItem = document.querySelector('.dropdown-item.active');
            if (activeItem) {
                dropdownBtn.textContent = activeItem.textContent.trim() + ' ▾';
            }
        }
    }
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.stat-card, .chart-card');
    let draggedItem = null;

    cards.forEach(card => {
        // Drag start event
        card.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        // Drag end event
        card.addEventListener('dragend', function(e) {
            draggedItem = null;
            this.style.opacity = '1';
        });

        // Drag over event
        card.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        // Drop event
        card.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && this !== draggedItem) {
                const parent = this.parentNode;
                const allCards = [...parent.children];
                const draggedPos = allCards.indexOf(draggedItem);
                const droppedPos = allCards.indexOf(this);

                if (draggedPos < droppedPos) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }
            }
        });
    });
}

// Button functionality
function initializeButtons() {
    // More options button handlers
    const moreOptionsButtons = document.querySelectorAll('.more-options-btn');
    moreOptionsButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.options-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    });
}
