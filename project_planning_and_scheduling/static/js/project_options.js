document.addEventListener("DOMContentLoaded", function() {
    // Initialize dropdowns for more options buttons
    initializeMoreOptions();

    const deleteProjectModal = document.getElementById('deleteProjectModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    let selectedProjectId = null; // Store the project ID to delete

    // Handle delete project action via more-options dropdown
    document.querySelectorAll('.delete-project').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior

            const projectCard = this.closest('.project-card'); // Find the closest project card
            selectedProjectId = projectCard.querySelector('[data-project-id]').getAttribute('data-project-id'); // Extract project ID

            if (!selectedProjectId) {
                console.error('Project ID not found!');
                return; // Exit if project ID is not found
            }

            // Open the delete modal
            openDeleteModal();
        });
    });

    // Confirm delete button in modal
    confirmDeleteBtn.addEventListener('click', function() {
        if (!selectedProjectId) return; // No project selected

        // Send a DELETE request to the server
        fetch(`/projects/delete/${selectedProjectId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'), // Ensure you have CSRF protection
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('Project deleted successfully.');
                location.reload(); // Refresh the page or remove the card from the DOM dynamically
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .catch(error => {
            console.error('There was a problem with the delete operation:', error);
        })
        .finally(() => {
            closeDeleteModal();
        });
    });

    // Cancel delete button in modal
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    // Close the dropdown if clicking outside of it
    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.options-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = "none"; // Hide all dropdowns
        });
    });

    // Function to open delete modal
    function openDeleteModal() {
        deleteProjectModal.style.display = 'block';
    }

    // Function to close delete modal
    function closeDeleteModal() {
        deleteProjectModal.style.display = 'none';
        selectedProjectId = null; // Reset selected project ID
    }

    // Function to initialize the dropdown options
    function initializeMoreOptions() {
        const moreOptionsBtns = document.querySelectorAll('.more-options-btn');
        moreOptionsBtns.forEach(button => {
            button.addEventListener('click', function(event) {
                const dropdown = this.nextElementSibling; // Get the dropdown related to the clicked button

                // Toggle the visibility of the dropdown
                dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

                event.stopPropagation(); // Prevent the click event from bubbling up
            });
        });
    }

    // Function to get CSRF token for AJAX requests
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Check if this cookie string begins with the name we want
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
