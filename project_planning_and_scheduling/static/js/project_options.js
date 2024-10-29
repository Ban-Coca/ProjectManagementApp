document.addEventListener("DOMContentLoaded", function() {
    // Initialize dropdowns for more options buttons
    initializeMoreOptions();

    // Close the dropdown if clicking outside of it
    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.options-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = "none"; // Hide all dropdowns
        });
    });

    // Handle delete project action
    document.querySelectorAll('.delete-project').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior

            const projectCard = this.closest('.project-card'); // Find the closest project card
            const projectId = projectCard.querySelector('[data-project-id]').getAttribute('data-project-id'); // Extract project ID

            if (!projectId) {
                console.error('Project ID not found!');
                return; // Exit if project ID is not found
            }

            // Confirm deletion
            const confirmDelete = confirm('Are you sure you want to delete this project?');
            if (!confirmDelete) return; // Exit if user cancels

            // Send a DELETE request to the server
            fetch(`/projects/delete/${projectId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'), // Ensure you have CSRF protection
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    console.log('Project deleted successfully.');
                    location.reload(); // Refresh the page
                } else {
                    throw new Error('Network response was not ok.');
                }
            })
            .catch(error => {
                console.error('There was a problem with the delete operation:', error);
            });
        });
    });

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
