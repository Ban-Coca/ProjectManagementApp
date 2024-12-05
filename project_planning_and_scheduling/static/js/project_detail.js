// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab_content');

    // Get the end date from the data-date attribute of the time-remaining paragraph
    const timeRemainingElement = document.querySelector('.time-remaining');
    const endDate = new Date(timeRemainingElement.getAttribute('data-date').trim());

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            tabContent.classList.add('active');
        });
    });

    // Function to calculate the time remaining
    function calculateTimeRemaining(endDate) {
        const now = new Date();
        const timeDiff = endDate - now;

        if (timeDiff <= 0) {
            return "Project has ended.";
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;

        let timeRemainingText = "";
        if (months > 0) {
            timeRemainingText += `${months} month${months > 1 ? 's' : ''} `;
        }
        if (remainingDays > 0) {
            timeRemainingText += `${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
        }

        return timeRemainingText.trim();
    }

    // Display the time remaining
    timeRemainingElement.textContent = calculateTimeRemaining(endDate);
});