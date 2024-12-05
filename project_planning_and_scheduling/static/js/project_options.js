document.addEventListener("DOMContentLoaded", function() {
    // Initialize dropdowns for more options buttons
    initializeMoreOptions();

    const deleteProjectModal = document.getElementById('deleteProjectModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
    const updateProjectModal = document.getElementById('updateProjectModal'); // Update modal
    const updateProjectForm = document.getElementById('updateProjectForm'); // Update form
    const closeIcon = document.getElementById("closeIcon");
    let selectedProjectId = null; // Store the project ID to delete or update
    
    // Handle delete project action via more-options dropdown
    document.querySelectorAll('.delete-project').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior

            selectedProjectId = this.getAttribute('data-project-id'); // Extract project ID

            if (!selectedProjectId) {
                console.error('Project ID not found!');
                return; // Exit if project ID is not found
            }

            // Open the delete modal
            openDeleteModal();
        });
    });

    // Handle update project action via more-options dropdown
    document.querySelectorAll('.update-project').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior

            selectedProjectId = this.getAttribute('data-project-id'); // Extract project ID

            if (!selectedProjectId) {
                console.error('Project ID not found!');
                return; // Exit if project ID is not found
            }

            // Open the update modal and populate the form with the project's current details
            openUpdateModal(selectedProjectId);
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
                window.location.href = '/projects/'; // Redirect to the projects list page
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
    closeIcon.addEventListener('click',closeDeleteModal);

    // Function to close delete modal if outside click
    function outsideClickDelete(event) {
        if (event.target == deleteProjectModal) {
            closeDeleteModal();
        }
    }

    // Add event listener for outside click on delete modal
    window.addEventListener("click", outsideClickDelete);
    cancelUpdateBtn.addEventListener('click',closeUpdateModal);
    // Function to close update modal if outside click
    function outsideClickUpdate(event) {
        if (event.target == updateProjectModal) {
            closeUpdateModal();
        }
    }

    // Add event listener for outside click on update modal
    window.addEventListener("click", outsideClickUpdate);

    // Submit update form in modal
    updateProjectForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form submission

        if (!selectedProjectId) return; // No project selected

        // Collect form data
        const formData = new FormData(updateProjectForm);
        
        // Send a PUT request to update the project details
        fetch(`/projects/update/${selectedProjectId}/`, {
            method: 'PUT',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'), // Ensure you have CSRF protection
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData.entries())) // Convert form data to JSON
        })
        .then(response => {
            if (response.ok) {
                console.log('Project updated successfully.');
                location.reload(); // Refresh the page or update the project card in the DOM dynamically
            } else {
                throw new Error('Network response was not ok.');
            }
        })
        .catch(error => {
            console.error('There was a problem with the update operation:', error);
        })
        .finally(() => {
            closeUpdateModal();
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

    // Function to open update modal and populate the form
    function openUpdateModal(projectId) {
        // Fetch project details from the server
        fetch(`/projects/update/${projectId}/`)
            .then(response => response.json())
            .then(data => {
                console.log(data.status);
                // Set values in the update form
                updateProjectForm.querySelector('[name="title"]').value = data.title;
                updateProjectForm.querySelector('[name="end_date"]').value = data.end_date;
                updateProjectForm.querySelector('[name="description"]').value = data.description;

                // Set the correct status in the dropdown
                const statusSelect = updateProjectForm.querySelector('[name="status"]');
                statusSelect.value = data.status;

                // Open the update modal
                updateProjectModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching project details:', error);
            });
    }

    // Function to close update modal
    function closeUpdateModal() {
        updateProjectModal.style.display = 'none';
        selectedProjectId = null; // Reset selected project ID
    }

    // Close the dropdown if clicking outside of it
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.more-options-btn')) {
            const dropdowns = document.querySelectorAll('.options-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = "none"; // Hide all dropdowns
            });
        }
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