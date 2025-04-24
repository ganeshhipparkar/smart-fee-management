/**
 * Client Authentication Utility
 * This script checks if a user is logged in and redirects to login page if not.
 * Include this script at the beginning of any protected client page.
 */

// Check if the user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const clientUser = localStorage.getItem('clientUser');
    const token = localStorage.getItem('token');
    
    if (!isLoggedIn || !clientUser || !token) {
        // Not logged in, redirect to login page
        // Use relative path that works regardless of the file structure
        window.location.href = 'clientLogin.html';
        return false;
    }
    
    try {
        // Parse the user data
        const userData = JSON.parse(clientUser);
        
        // If no valid user data, redirect to login
        if (!userData || !userData.id || !userData.email) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('clientUser');
            localStorage.removeItem('token');
            window.location.href = 'clientLogin.html';
            return false;
        }
        
        return userData;
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('clientUser');
        localStorage.removeItem('token');
        window.location.href = 'clientLogin.html';
        return false;
    }
}

// Get user information
function getUserInfo() {
    const clientUser = localStorage.getItem('clientUser');
    if (!clientUser) return null;
    
    try {
        return JSON.parse(clientUser);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('clientUser');
    localStorage.removeItem('token');
    window.location.href = 'clientLogin.html';
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const userData = checkAuth();
    
    // If user is authenticated, update UI with user information
    if (userData) {
        // Find elements to update with user info
        const userNameElements = document.querySelectorAll('.user-name');
        const userInitialsElements = document.querySelectorAll('.user-initials');
        
        // Update user name elements if they exist
        if (userNameElements.length > 0) {
            userNameElements.forEach(element => {
                element.textContent = userData.fullName || userData.fullname;
            });
        }
        
        // Update user initials elements if they exist
        if (userInitialsElements.length > 0) {
            const name = userData.fullName || userData.fullname || '';
            const initials = name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase();
                
            userInitialsElements.forEach(element => {
                element.textContent = initials;
            });
        }
        
        // Set up logout buttons
        const logoutButtons = document.querySelectorAll('.logout-button');
        if (logoutButtons.length > 0) {
            logoutButtons.forEach(button => {
                button.addEventListener('click', logout);
            });
        }
    }
}); 