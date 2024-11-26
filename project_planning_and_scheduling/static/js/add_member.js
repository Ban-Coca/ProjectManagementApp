// DOM Elements
const modal = document.getElementById('addMemberModal');
const addMemberBtn = document.getElementById('addMemberButton');
const closeBtn = modal.querySelector('.close');
const searchInput = modal.querySelector('.search-input');
const clearSearchBtn = modal.querySelector('.close-button');
const membersList = modal.querySelector('.members-list');

// Show modal and load initial data
addMemberBtn.onclick = () => {
    modal.style.display = 'flex';
    loadProjectMembers();
    searchInput.value = '';
};

// Close modal handlers
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
};

// Clear search
clearSearchBtn.onclick = () => {
    searchInput.value = '';
    loadProjectMembers();
};

// Create HTML for member items
const createMemberItem = (member, isProjectMember = false) => {
    const initials = member.username.slice(0, 2).toUpperCase();
    const fullName = member.full_name || member.username;
    
    return `
        <div class="member-item">
            <div class="member-avatar">
                <span class="avatar-text">${initials}</span>
            </div>
            <div class="member-info">
                <span class="member-name">${fullName}</span>
                ${member.email ? `<span class="member-email">${member.email}</span>` : ''}
                <span class="member-role">${member.role || 'Member'}</span>
            </div>
            ${!isProjectMember ? `
                <button class="add-user-btn" data-user-id="${member.id}" onclick="addMember(${member.id})">
                    Add
                </button>
            ` : ''}
        </div>
    `;
};

// Load project members
const loadProjectMembers = async () => {
    membersList.innerHTML = '<div class="loading">Loading members...</div>';
    
    try {
        const response = await fetch(`/project/${projectId}/members/`);
        if (!response.ok) throw new Error('Failed to load members');
        
        const members = await response.json();
        let membersHTML = '<h4>Project Members</h4>';
        
        if (members.length === 0) {
            membersHTML += '<div class="no-results">No members yet</div>';
        } else {
            members.forEach(member => {
                // Ensure you are passing the correct member data
                membersHTML += `
                    <div class="member-item">
                        <span class="member-name">${member.username.username}</span>
                        <span class="member-role">${member.role}</span>
                    </div>
                `;
            });
        }
        
        membersList.innerHTML = membersHTML;
    } catch (error) {
        console.error('Error loading members:', error);
        membersList.innerHTML = '<div class="error">Failed to load members. Please try again.</div>';
    }
};


// Search users with debouncing
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    const searchTerm = e.target.value.trim();
    if (!searchTerm) {
        loadProjectMembers();  // Assuming this function reloads all project members
        return;
    }
    
    searchTimeout = setTimeout(async () => {
        membersList.innerHTML = '<div class="loading">Searching users...</div>';
        
        try {
            // Use searchTerm instead of searchQuery
            const response = await fetch(`/projects/${projectId}/search-users/?q=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Search failed');
            
            const users = await response.json();
            let resultsHTML = '<h4>Search Results</h4>';
            
            if (users.length === 0) {
                resultsHTML += '<div class="no-results">No users found</div>';
            } else {
                users.forEach(user => {
                    resultsHTML += createMemberItem(user, false);  // False because they are not yet members
                });
            }
            
            membersList.innerHTML = resultsHTML;
        } catch (error) {
            console.error('Error searching users:', error);
            membersList.innerHTML = '<div class="error">Search failed. Please try again.</div>';
        }
    }, 300); // debounce time
});


// Add member function
const addMember = async (userId) => {
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding...';
    
    try {
        const response = await fetch(`/project/${projectId}/add-member/`, {
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

        if (!response.ok) throw new Error('Failed to add member');

        await response.json();
        loadProjectMembers();
        
        // Clear search and show success message
        searchInput.value = '';
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = 'Member added successfully';
        membersList.insertAdjacentElement('afterbegin', successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
        console.error('Error adding member:', error);
        button.textContent = 'Error';
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }
};

// Get CSRF token
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (addMemberBtn) {
        // Only initialize if user has permission
        const style = document.createElement('style');
        style.textContent = `
            .success-message {
                background-color: #d4edda;
                color: #155724;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 10px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }
});