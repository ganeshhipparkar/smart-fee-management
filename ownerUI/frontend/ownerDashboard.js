document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isOwnerLoggedIn = localStorage.getItem('isOwnerLoggedIn') === 'true';
    const ownerToken = localStorage.getItem('ownerToken');
    
    if (!isOwnerLoggedIn || !ownerToken) {
        // If not logged in, redirect to login page
        window.location.href = 'ownerLogin.html';
        return;
    }
    
    // Load owner data from localStorage and update the UI
    try {
        const ownerData = JSON.parse(localStorage.getItem('ownerUser'));
        
        if (ownerData) {
            // Update the user name display
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = ownerData.ownerName || 'Owner';
            }
            
            // Generate initials for avatar
            const initialsElement = document.getElementById('userInitials');
            if (initialsElement && ownerData.ownerName) {
                const nameParts = ownerData.ownerName.split(' ');
                let initials = '';
                
                if (nameParts.length >= 2) {
                    // Get first letter of first and last name
                    initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
                } else if (nameParts.length === 1) {
                    // If only one name, use first two letters
                    initials = nameParts[0].substring(0, 2);
                } else {
                    initials = 'OU'; // Owner User fallback
                }
                
                initialsElement.textContent = initials.toUpperCase();
            }
            
            // Update business name in the title if needed
            document.title = `${ownerData.businessName || 'Owner'} Dashboard - Smart Fee Management`;

            // Update dashboard header with business type if applicable
            const dashboardHeader = document.querySelector('header h1');
            if (dashboardHeader && ownerData.businessType && ownerData.serviceName) {
                let businessTypeDisplay = ownerData.businessType;
                if (businessTypeDisplay === 'other' && ownerData.otherBusinessType) {
                    businessTypeDisplay = ownerData.otherBusinessType;
                }
                dashboardHeader.textContent = `${ownerData.serviceName} Dashboard`;
            }
        }
    } catch (error) {
        console.error('Error loading owner data:', error);
    }
    
    // Theme toggle functionality
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    // Check for saved theme preference or respect OS setting
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply the right theme
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Mobile sidebar functionality
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
    });

    // Modal functionality
    const addClientModal = document.getElementById('addClientModal');
    const addClientBtn = document.getElementById('addClientBtn');
    const closeAddClientModal = document.getElementById('closeAddClientModal');
    const cancelAddClient = document.getElementById('cancelAddClient');

    addClientBtn.addEventListener('click', () => {
        addClientModal.classList.remove('hidden');
        gsap.to(addClientModal.querySelector('div > div'), { 
            y: 0, 
            opacity: 1, 
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'all' 
        });
    });

    const closeModal = () => {
        gsap.to(addClientModal.querySelector('div > div'), { 
            y: -20, 
            opacity: 0, 
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                addClientModal.classList.add('hidden');
            }
        });
    };

    closeAddClientModal.addEventListener('click', closeModal);
    cancelAddClient.addEventListener('click', closeModal);

    // Toast notification functionality
    const showToast = (message, isSuccess = true) => {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        
        // Set message and color based on success/error
        toastMessage.textContent = message;
        toast.className = toast.className.replace(/bg-\w+-\d+/, isSuccess ? 'bg-green-500' : 'bg-red-500');
        
        // Animation
        gsap.to(toast, { 
            y: 0, 
            opacity: 1, 
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                setTimeout(() => {
                    gsap.to(toast, { 
                        y: 20,
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in'
                    });
                }, 5000);
            }
        });
    };

    // Add citiesByState object for city-state filtering
    const citiesByState = {
        "andhra-pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
        "arunachal-pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
        "assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia"],
        "bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah"],
        "chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
        "goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
        "gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
        "haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak"],
        "himachal-pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu"],
        "jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
        "karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga"],
        "kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
        "madhya-pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
        "maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
        "manipur": ["Imphal", "Bishnupur", "Thoubal", "Churachandpur"],
        "meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh"],
        "mizoram": ["Aizawl", "Lunglei", "Champhai", "Kolasib"],
        "nagaland": ["Kohima", "Dimapur", "Mokokchung", "Wokha", "Tuensang"],
        "odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
        "punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
        "rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
        "sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing"],
        "tamil-nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
        "tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar"],
        "uttar-pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Allahabad"],
        "uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee"],
        "west-bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
    };
    
    // Function to update cities dropdown based on selected state
    function updateCitiesInModal() {
        const stateSelect = document.getElementById('clientState');
        const citySelect = document.getElementById('clientCity');
        
        if (!stateSelect || !citySelect) return;
        
        // Clear existing options
        citySelect.innerHTML = '<option disabled selected>Select City</option>';
        
        const selectedState = stateSelect.value;
        
        if (selectedState && citiesByState[selectedState]) {
            citiesByState[selectedState].forEach(city => {
                const option = document.createElement('option');
                option.value = city.toLowerCase().replace(/\s+/g, '-');
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    }
    
    // Initialize city dropdown when state is changed
    const stateSelect = document.getElementById('clientState');
    if (stateSelect) {
        stateSelect.addEventListener('change', updateCitiesInModal);
    }
    
    // Form validation for password match
    if (document.getElementById('clientPassword') && document.getElementById('clientConfirmPassword')) {
        const passwordInput = document.getElementById('clientPassword');
        const confirmInput = document.getElementById('clientConfirmPassword');
        
        confirmInput.addEventListener('input', function() {
            if (passwordInput.value !== confirmInput.value) {
                confirmInput.setCustomValidity("Passwords don't match");
            } else {
                confirmInput.setCustomValidity('');
            }
        });
        
        passwordInput.addEventListener('input', function() {
            if (confirmInput.value && passwordInput.value !== confirmInput.value) {
                confirmInput.setCustomValidity("Passwords don't match");
            } else {
                confirmInput.setCustomValidity('');
            }
        });
    }
    
    // Update form submission to send all fields to server and store in clientRegisters table
    if (document.getElementById('addClientForm')) {
        const addClientForm = document.getElementById('addClientForm');
        
        addClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate password match
            const password = document.getElementById('clientPassword').value;
            const confirmPassword = document.getElementById('clientConfirmPassword').value;
            
            if (password !== confirmPassword) {
                showToast("Passwords don't match", false);
                return;
            }
            
            // Show loading state
            const submitButton = addClientForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Adding client...';
            
            // Get form data
            const formData = new FormData(addClientForm);
            const formDataObj = {};
            
            // Convert FormData to plain object
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Add owner ID from token if not already included
            const token = localStorage.getItem('ownerToken');
            if (token) {
                // Parse the JWT token to get owner ID
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(window.atob(base64));
                    if (payload.id) {
                        formDataObj.ownerId = payload.id;
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
                }
            }
            
            // Use fetch API instead of form submission to prevent redirect
            fetch('http://localhost:3000/api/register-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || 'Failed to register client');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Success
                closeModal();
                showToast('Client added successfully to clientRegisters database');
                
                // Reset form
                addClientForm.reset();
                
                // Attempt to refresh client list
                try {
                    fetchClients();
                } catch(e) {
                    console.log('Could not refresh client list after registration');
                }
            })
            .catch(error => {
                console.error('Registration error:', error);
                showToast('Error: ' + (error.message || 'Failed to register client'), false);
            })
            .finally(() => {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        });
    }
    
    // Function to fetch and display clients
    async function fetchClients() {
        try {
            // Basic elements
            const clientTable = document.getElementById('clientTable');
            const clientCount = document.getElementById('clientCount');
            
            // Empty state HTML
            const emptyHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No clients found</td></tr>`;
            
            // Try to fetch data
            let clients = [];
            try {
                const res = await fetch('http://localhost:3000/api/clients', {
                    headers: {'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`}
                });
                if (res.ok) clients = await res.json();
            } catch (e) {
                console.log('API not available');
            }
            
            // Update count
            if (clientCount) clientCount.textContent = clients.length || '0';
            
            // Handle empty results or show clients
            if (!clientTable) return;
            
            if (!clients || clients.length === 0) {
                clientTable.innerHTML = emptyHTML;
                return;
            }
            
            // Add clients to table
            clientTable.innerHTML = '';
            clients.forEach(client => {
                const row = document.createElement('tr');
                const statusClass = client.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' : 
                                    client.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-green-100 text-green-800';
                const statusText = client.paymentStatus === 'overdue' ? 'Overdue' : 
                                  client.paymentStatus === 'pending' ? 'Pending' : 'Active';
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div>
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${client.fullname}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">${client.email || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${client.mobile}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass} dark:bg-opacity-30">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${client.nextDueDate || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end space-x-2">
                            <button class="remind-btn p-2 rounded-lg text-yellow-600" data-client-id="${client.id || client._id}">📝</button>
                            <button class="mark-paid-btn p-2 rounded-lg text-green-600" data-client-id="${client.id || client._id}">✓</button>
                            <button class="remove-client-btn p-2 rounded-lg text-red-600" data-client-id="${client.id || client._id}">✕</button>
                        </div>
                    </td>
                `;
                clientTable.appendChild(row);
            });
            
            // Add event listeners
            setupClientActionButtons();
        } catch (e) {
            console.log('Client display error');
        }
    }
    
    // Set up event listeners for client action buttons
    function setupClientActionButtons() {
        // Remind button
        document.querySelectorAll('.remind-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const clientId = e.currentTarget.dataset.clientId;
                try {
                    const response = await fetch(`/api/clients/${clientId}/remind`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to send reminder');
                    }
                    
                    showToast('Payment reminder sent successfully');
                } catch (error) {
                    console.error('Error sending reminder:', error);
                    showToast('Failed to send reminder', false);
                }
            });
        });
        
        // Mark paid button
        document.querySelectorAll('.mark-paid-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const clientId = e.currentTarget.dataset.clientId;
                try {
                    const response = await fetch(`/api/clients/${clientId}/mark-paid`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to mark as paid');
                    }
                    
                    showToast('Payment marked as completed');
                    // Refresh client list to update status
                    fetchClients();
                } catch (error) {
                    console.error('Error marking as paid:', error);
                    showToast('Failed to mark as paid', false);
                }
            });
        });
        
        // Remove client button
        document.querySelectorAll('.remove-client-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to remove this client?')) {
                    const clientId = e.currentTarget.dataset.clientId;
                    try {
                        const response = await fetch(`/api/clients/${clientId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to remove client');
                        }
                        
                        showToast('Client removed successfully');
                        // Refresh client list
                        fetchClients();
                    } catch (error) {
                        console.error('Error removing client:', error);
                        showToast('Failed to remove client', false);
                    }
                }
            });
        });
    }
    
    // Function to fetch and display pending client approvals
    async function fetchPendingClients() {
        try {
            const response = await fetch('/api/clients/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                }
            });
            
            if (!response.ok) {
                // Just log the error, don't show toast
                console.log('Pending clients API not available yet');
                
                // Display empty state
                const pendingClientsTable = document.getElementById('pendingClientsTable');
                if (pendingClientsTable) {
                    pendingClientsTable.innerHTML = `
                        <tr>
                            <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                No pending client approvals
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            const pendingClients = await response.json();
            const pendingClientsTable = document.getElementById('pendingClientsTable');
            
            if (pendingClientsTable) {
                // Clear existing rows
                pendingClientsTable.innerHTML = '';
                
                // Display empty state by default
                if (!pendingClients || pendingClients.length === 0) {
                    pendingClientsTable.innerHTML = `
                        <tr>
                            <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                No pending client approvals
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Add pending client rows - simplified version
                pendingClients.forEach(client => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">${client.fullname}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${client.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${client.mobile}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${client.requestDate || 'N/A'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex justify-end space-x-2">
                                <button class="approve-client-btn px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition" data-client-id="${client.id}">
                                    Approve
                                </button>
                                <button class="reject-client-btn px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition" data-client-id="${client.id}">
                                    Reject
                                </button>
                            </div>
                        </td>
                    `;
                    pendingClientsTable.appendChild(row);
                });
                
                // Set up event listeners for approval buttons
                setupApprovalButtons();
            }
        } catch (error) {
            // Just log error to console, no toast
            console.log('Pending clients functionality not available yet');
            
            // Display empty state
            const pendingClientsTable = document.getElementById('pendingClientsTable');
            if (pendingClientsTable) {
                pendingClientsTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No pending client approvals
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    // Setup event listeners for approval buttons
    function setupApprovalButtons() {
        // Approve button
        document.querySelectorAll('.approve-client-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const clientId = e.currentTarget.dataset.clientId;
                try {
                    const response = await fetch(`/api/clients/${clientId}/approve`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to approve client');
                    }
                    
                    showToast('Client approved successfully');
                    // Refresh pending clients list
                    fetchPendingClients();
                    // Refresh client list to show new client
                    fetchClients();
                } catch (error) {
                    console.error('Error approving client:', error);
                    showToast('Failed to approve client', false);
                }
            });
        });
        
        // Reject button
        document.querySelectorAll('.reject-client-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to reject this client?')) {
                    const clientId = e.currentTarget.dataset.clientId;
                    try {
                        const response = await fetch(`/api/clients/${clientId}/reject`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to reject client');
                        }
                        
                        showToast('Client rejected successfully');
                        // Refresh pending clients list
                        fetchPendingClients();
                    } catch (error) {
                        console.error('Error rejecting client:', error);
                        showToast('Failed to reject client', false);
                    }
                }
            });
        });
    }
    
    // Function to fetch and display payment history
    async function fetchPaymentHistory() {
        try {
            const response = await fetch('/api/payments/recent', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
                }
            });
            
            if (!response.ok) {
                // Just log the error, don't show toast
                console.log('Payment history API not available yet');
                return;
            }
            
            const payments = await response.json();
            const paymentHistoryTable = document.getElementById('paymentHistoryTable');
            
            if (paymentHistoryTable) {
                // Clear existing rows
                paymentHistoryTable.innerHTML = '';
                
                // Display empty state by default
                if (!payments || payments.length === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.innerHTML = `
                        <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No recent payment history
                        </td>
                    `;
                    paymentHistoryTable.appendChild(emptyRow);
                    return;
                }
                
                // Add payment history rows with simplified display
                payments.forEach(payment => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="ml-3">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">${payment.clientName}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${payment.date}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">₹${payment.amount}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">${payment.status}</span>
                        </td>
                    `;
                    paymentHistoryTable.appendChild(row);
                });
            }
        } catch (error) {
            // Just log error to console, no toast
            console.log('Payment history not available yet');
            
            // Display empty state anyway
            const paymentHistoryTable = document.getElementById('paymentHistoryTable');
            if (paymentHistoryTable) {
                paymentHistoryTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No recent payment history
                        </td>
                    </tr>
                `;
            }
        }
    }
    
    // Load all data when page loads
    setTimeout(() => {
        fetchClients();
        fetchPendingClients();
        fetchPaymentHistory();
    }, 500); // Small delay to ensure DOM is fully loaded
}); 