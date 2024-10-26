// Get modal element
var modal = document.getElementById("projectModal");
// Get open modal button
var modalBtn = document.getElementById("createProjectBtn");
// Get close button
var closeBtn = document.getElementById("closeModalBtn");
var projectTitleInput = document.getElementById("projectTitle"); // Assuming this is the ID of the title input field
var deadlineInput = document.getElementById("projectDeadline"); // Assuming this is the ID of the deadline input field
var cancelBtn = document.getElementById("cancelBtn");
// Listen for open click
modalBtn.addEventListener("click", openModal);
// Listen for close click
closeBtn.addEventListener("click", closeModal);
// Listen for outside click
window.addEventListener("click", outsideClick);
// Listen for cancel button
cancelBtn.addEventListener("click",closeModal);

// Function to open modal
function openModal() {
    modal.style.display = "block";
    // Change the URL to /projects/projects_list/create_project without reloading the page
    history.pushState(null, null, '/projects/create/');
}

// Function to close modal
function closeModal() {
    modal.style.display = "none";
    // Change the URL back to the projects list page without reloading the page
    history.pushState(null, null, '/projects/');
}

// Function to close modal if outside click
function outsideClick(e) {
    if (e.target == modal) {
        closeModal();
    }
}

// Validate project title (no special characters allowed)
projectTitleInput.addEventListener("input", function () {
    var invalidChars = /[^a-zA-Z0-9 ]/g; // Regex to match any non-alphanumeric or space characters
    if (invalidChars.test(this.value)) {
        this.setCustomValidity("Special characters are not allowed.");
    } else {
        this.setCustomValidity(""); // Clear error message
    }
});

// Validate project deadline (no past dates allowed)
deadlineInput.addEventListener("input", function() {
    var currentDate = new Date();
    var selectedDate = new Date(this.value);

    if (selectedDate < currentDate.setHours(0, 0, 0, 0)) { // Reset time to 00:00:00 for comparison
        this.setCustomValidity("Invalid deadline: Deadline cannot be in the past.");
    } else {
        this.setCustomValidity(""); // Clear error message
    }
});

// Handle form submission
document.getElementById("createProjectForm").addEventListener("submit", function(event) {
    // Validate title one more time before submission
    event.preventDefault(); // Prevent default form submission
    var submitButton = document.getElementById("createProjectBtn");
    var invalidChars = /[^a-zA-Z0-9 ]/g;
    if (invalidChars.test(projectTitleInput.value)) {
        projectTitleInput.reportValidity(); // Display error message
        return; // Stop form submission
    }

    // Disable the button to prevent multiple clicks
    submitButton.disabled = true;
    
    // Validate deadline again before submission
    var currentDate = new Date();
    var selectedDate = new Date(deadlineInput.value);
    if (selectedDate < currentDate.setHours(0, 0, 0, 0)) {
        deadlineInput.reportValidity(); // Display error message
        return; // Stop form submission
    }

    // Use the Fetch API to send the form data
    var formData = new FormData(this);

    fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        if (response.ok) {
            closeModal(); // Close modal
            location.reload(); // Reload the page
        } else {
            response.text().then(text => {
                alert("Error: " + text);
                submitButton.disabled = false; // Re-enable the button
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("An error occurred while creating the project.");
        submitButton.disabled = false; // Re-enable the button
    });
});


// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Check if this cookie string begins with the given name
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
