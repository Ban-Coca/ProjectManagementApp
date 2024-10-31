// DOM Elements
const modal = document.getElementById('addMemberModal');
const addMemberBtn = document.getElementById('addMemberButton');
const closeBtn = modal.querySelector('.close');
const searchInput = modal.querySelector('.search-input');
const clearSearchBtn = modal.querySelector('.close-button');
const membersList = modal.querySelector('.members-list');

// Show modal
addMemberBtn.onclick = () => {
    modal.style.display = 'flex';
    loadProjectMembers();
    searchInput.value = '';
};

// Close modal
closeBtn.onclick = () => {
    modal.style.display = 'none';
};

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Clear search input
clearSearchBtn.onclick = () => {
    searchInput.value = '';
    loadProjectMembers();
};

// Function to create member item HTML
const createMemberItem = (member, isProjectMember = false) => {
    const initials = member.username.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();

    return `
        <div class="member-item">
            <div class="member-avatar">
                <span class="avatar-text">${initials}</span>
            </div>
            <div class="member-info">
                <span class="member-name">${member.username}</span>
                <span class="member-role">${isProjectMember ? member.role : ''}</span>
            </div>
            ${!isProjectMember ? `
                <button class="add-user-btn" data-user-id="${member.id}">
                    Add
                </button>
            ` : ''}
        </div>
    `;
};

// Load project members
const loadProjectMembers = async () => {
    try {
        const response = await fetch(`/api/projects/${projectId}/members/`);
        const members = await response.json();
        
        let membersHTML = '<h4>Project Members</h4>';
        members.forEach(member => {
            membersHTML += createMemberItem(member, true);
        });
        
        membersList.innerHTML = membersHTML;
    } catch (error) {
        console.error('Error loading project members:', error);
    }
};

// Search users
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm === '') {
            loadProjectMembers();
            return;
        }

        try {
            const response = await fetch(`/api/users/search/?q=${searchTerm}&project_id=${projectId}`);
            const users = await response.json();
            
            let usersHTML = '<h4>Search Results</h4>';
            if (users.length === 0) {
                usersHTML += '<div class="no-results">No users found</div>';
            } else {
                users.forEach(user => {
                    usersHTML += createMemberItem(user);
                });
            }
            
            membersList.innerHTML = usersHTML;

            // Add event listeners to Add buttons
            const addButtons = membersList.querySelectorAll('.add-user-btn');
            addButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const userId = button.dataset.userId;
                    try {
                        const response = await fetch(`/api/projects/${projectId}/members/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({
                                user_id: userId,
                                role: 'MEMBER'
                            })
                        });

                        if (response.ok) {
                            // Refresh the members list
                            loadProjectMembers();
                            // Clear search
                            searchInput.value = '';
                        } else {
                            throw new Error('Failed to add member');
                        }
                    } catch (error) {
                        console.error('Error adding member:', error);
                    }
                });
            });
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }, 300); // Debounce search for 300ms
});

// Utility function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}