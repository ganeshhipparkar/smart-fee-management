document.addEventListener('DOMContentLoaded', () => {
    console.log('Services.js loaded');
    
    const addOfferingBtn = document.getElementById('addOfferingBtn');
    const offeringModal = document.getElementById('offeringModal');
    const viewCodeModal = document.getElementById('viewCodeModal');
    const closeModalButtons = document.querySelectorAll('.modal .close-button');
    const offeringForm = document.getElementById('offeringForm');
    const modalTitle = document.getElementById('modalTitle');
    const offeringIdInput = document.getElementById('offeringId');
    const offeringsTableBody = document.getElementById('offeringsTableBody');
    const paymentPlansContainer = document.getElementById('paymentPlansContainer');
    const addPlanBtn = document.getElementById('addPlanBtn');
    const entryCodeDisplay = document.getElementById('entryCodeDisplay');
    const currentEntryCodeSpan = document.getElementById('currentEntryCode');
    const copyEntryCodeBtn = document.getElementById('copyEntryCodeBtn');
    const regenerateEntryCodeBtn = document.getElementById('regenerateEntryCodeBtn');
    const displayEntryCodeSpan = document.getElementById('displayEntryCode');
    const copyCodeFromViewModalBtn = document.getElementById('copyCodeFromViewModalBtn');
    const regenerateCodeFromViewModalBtn = document.getElementById('regenerateCodeFromViewModalBtn');

    console.log('Add Offering Button:', addOfferingBtn);
    console.log('Offering Modal:', offeringModal);

    // Function to generate a unique 5-digit service ID
    function generateUniqueServiceId() {
        // Generate a random 5-digit number
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    // Function to check if the generated ID is unique (to be implemented with backend)
    async function isServiceIdUnique(serviceId) {
        try {
            const response = await fetch(`/api/owner/offerings/check-id/${serviceId}`, {
                headers: {
                    'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                }
            });
            const data = await response.json();
            return data.isUnique;
        } catch (error) {
            console.error('Error checking service ID uniqueness:', error);
            return false;
        }
    }

    // Function to get a unique service ID
    async function getUniqueServiceId() {
        let serviceId = generateUniqueServiceId();
        let isUnique = await isServiceIdUnique(serviceId);
        
        // Try up to 5 times to get a unique ID
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            serviceId = generateUniqueServiceId();
            isUnique = await isServiceIdUnique(serviceId);
            attempts++;
        }
        
        return serviceId;
    }

    // Function to open the offering modal
    function openOfferingModal(offering = null) {
        console.log('Opening modal...');
        offeringForm.reset(); // Clear form
        paymentPlansContainer.innerHTML = ''; // Clear payment plans
        entryCodeDisplay.style.display = 'none'; // Hide code display by default

        if (offering) {
            // Edit mode
            console.log('Edit mode for offering:', offering);
            modalTitle.textContent = 'Edit Offering';
            offeringIdInput.value = offering._id; // Assuming _id from backend
            document.getElementById('offeringName').value = offering.name;
            document.getElementById('offeringDescription').value = offering.description;
            document.getElementById('offeringStatus').value = offering.status;

            // Populate payment plans
            offering.paymentPlans.forEach(plan => addPaymentPlanInput(plan));

            // Show and set the entry code
            entryCodeDisplay.style.display = 'block';
            currentEntryCodeSpan.textContent = offering.entryCode || 'Not yet generated'; // Display actual code
            
            // Display service ID if it exists
            if (offering.serviceId) {
                document.getElementById('serviceIdDisplay').textContent = offering.serviceId;
                document.getElementById('serviceIdContainer').style.display = 'block';
            } else {
                document.getElementById('serviceIdContainer').style.display = 'none';
            }
        } else {
            // Add mode
            console.log('Add mode');
            modalTitle.textContent = 'Add New Offering';
            offeringIdInput.value = '';
            // Add a default payment plan input
            addPaymentPlanInput();
            document.getElementById('serviceIdContainer').style.display = 'none';
        }
        
        console.log('Setting modal display to block');
        offeringModal.style.display = 'block';
        console.log('Modal display style:', offeringModal.style.display);
    }

    // Function to close any modal
    function closeModal() {
        console.log('Closing modals...');
        offeringModal.style.display = 'none';
        viewCodeModal.style.display = 'none';
        console.log('Modal display styles:', {
            offeringModal: offeringModal.style.display,
            viewCodeModal: viewCodeModal.style.display
        });
    }

    // Function to add a payment plan input group
    function addPaymentPlanInput(plan = null) {
        const planGroup = document.createElement('div');
        planGroup.classList.add('payment-plan-group', 'flex', 'items-center', 'gap-3');
        planGroup.innerHTML = `
            <select class="plan-type flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white" required>
                <option value="">Select Plan Type</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
            </select>
            <input type="number" class="plan-amount flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent dark:bg-gray-700 dark:text-white" placeholder="Amount" required>
            <button type="button" class="remove-plan-btn w-8 h-8 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800/50 transition">&times;</button>
        `;

        if (plan) {
            planGroup.querySelector('.plan-type').value = plan.type;
            planGroup.querySelector('.plan-amount').value = plan.amount;
        }

        paymentPlansContainer.appendChild(planGroup);

        // Add event listener to the remove button
        planGroup.querySelector('.remove-plan-btn').addEventListener('click', () => {
            planGroup.remove();
            if (paymentPlansContainer.children.length === 0) {
                addPaymentPlanInput(); // Ensure at least one plan exists
            }
        });
    }

    // Event listeners
    addOfferingBtn.addEventListener('click', () => {
        console.log('Add Offering button clicked!');
        openOfferingModal();
    });
    
    closeModalButtons.forEach(btn => btn.addEventListener('click', () => {
        console.log('Close button clicked');
        closeModal();
    }));

    window.addEventListener('click', (event) => {
        if (event.target === offeringModal || event.target === viewCodeModal) {
            console.log('Clicked outside modal');
            closeModal();
        }
    });

    addPlanBtn.addEventListener('click', () => addPaymentPlanInput());

    // Handle form submission (Add/Edit Offering)
    offeringForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const offeringId = offeringIdInput.value;
        const name = document.getElementById('offeringName').value;
        const description = document.getElementById('offeringDescription').value;
        const status = document.getElementById('offeringStatus').value;
        let serviceId = offeringId ? document.getElementById('serviceIdDisplay').textContent : null;

        const paymentPlans = [];
        paymentPlansContainer.querySelectorAll('.payment-plan-group').forEach(group => {
            const type = group.querySelector('.plan-type').value;
            const amount = parseFloat(group.querySelector('.plan-amount').value);
            if (type && !isNaN(amount)) {
                paymentPlans.push({ type, amount });
            }
        });

        if (paymentPlans.length === 0) {
            alert('Please add at least one payment plan.');
            return;
        }

        const offeringData = {
            name,
            description,
            status,
            paymentPlans
        };

        // If editing, include the existing service ID
        if (serviceId && serviceId !== 'N/A') {
            offeringData.serviceId = serviceId;
        }
        // Generate a unique service ID for new offerings
        else if (!offeringId) {
            try {
                serviceId = await getUniqueServiceId();
                offeringData.serviceId = serviceId;
            } catch (error) {
                console.error('Error generating unique service ID:', error);
                alert('Failed to generate a unique service ID. Please try again.');
                return;
            }
        }

        let url = '/api/owner/offerings'; // Backend endpoint for adding
        let method = 'POST';

        if (offeringId) {
            // Editing existing offering
            url = `/api/owner/offerings/${offeringId}`; // Backend endpoint for updating
            method = 'PUT';
            // Do not include entryCode in the update payload unless regenerating
             // The regenerate action will handle the code update separately
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                },
                body: JSON.stringify(offeringData)
            });

            if (response.ok) {
                closeModal();
                // Refresh the offerings list (conceptual - would fetch data from backend)
                console.log('Offering saved successfully!');
                loadOfferings(); // Call a function to reload the table
            } else {
                const error = await response.json();
                alert('Failed to save offering: ' + (error.message || response.statusText));
            }
        } catch (error) {
            console.error('Error saving offering:', error);
            alert('An error occurred while saving the offering.');
        }
    });

    // Handle Edit/Delete/View Code buttons on the table (Delegation)
    offeringsTableBody.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('edit-offering-btn')) {
            const offeringId = target.dataset.id;
            // Fetch offering data from backend and open modal
            console.log('Edit offering with ID:', offeringId);
            try {
                const response = await fetch(`/api/owner/offerings/${offeringId}`, {
                     headers: {
                        'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                    }
                });
                if (response.ok) {
                    const offering = await response.json();
                    openOfferingModal(offering);
                } else {
                     const error = await response.json();
                    alert('Failed to fetch offering details: ' + (error.message || response.statusText));
                }
            } catch (error) {
                console.error('Error fetching offering:', error);
                alert('An error occurred while fetching offering details.');
            }


        } else if (target.classList.contains('delete-offering-btn')) {
            const offeringId = target.dataset.id;
            if (confirm('Are you sure you want to delete this offering? This action cannot be undone.')) {
                // Send delete request to backend
                console.log('Delete offering with ID:', offeringId);
                 try {
                    const response = await fetch(`/api/owner/offerings/${offeringId}`, {
                         method: 'DELETE',
                         headers: {
                            'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                        }
                    });
                     if (response.ok) {
                        console.log('Offering deleted successfully!');
                         loadOfferings(); // Reload the table
                     } else {
                         const error = await response.json();
                         alert('Failed to delete offering: ' + (error.message || response.statusText));
                     }
                 } catch (error) {
                    console.error('Error deleting offering:', error);
                    alert('An error occurred while deleting the offering.');
                 }
            }

        } else if (target.classList.contains('view-code-btn')) {
             const entryCode = target.dataset.code; // Get the code directly from the data attribute (for example)
             // In a real app, you might fetch this from the backend on demand for security
            displayEntryCodeSpan.textContent = entryCode;
            // Store the offering ID to regenerate if needed
            viewCodeModal.dataset.offeringId = target.closest('tr').querySelector('.edit-offering-btn').dataset.id; // Assuming the edit button has the ID
            viewCodeModal.style.display = 'block';
        }
    });

    // Handle Copy Entry Code button in the Add/Edit Modal
    copyEntryCodeBtn.addEventListener('click', () => {
        const code = currentEntryCodeSpan.textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Entry Code copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy code:', err);
            alert('Failed to copy Entry Code.');
        });
    });

     // Handle Copy Code button in the View Code Modal
     copyCodeFromViewModalBtn.addEventListener('click', () => {
         const code = displayEntryCodeSpan.textContent;
         navigator.clipboard.writeText(code).then(() => {
             alert('Entry Code copied to clipboard!');
         }).catch(err => {
             console.error('Failed to copy code:', err);
             alert('Failed to copy Entry Code.');
         });
     });


    // Handle Regenerate Entry Code button in the Add/Edit Modal
    regenerateEntryCodeBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to regenerate the Entry Code? This will invalidate the old code and clients using it will lose access.')) {
             const offeringId = offeringIdInput.value;
             if (!offeringId) return; // Should not happen in edit mode

             try {
                const response = await fetch(`/api/owner/offerings/${offeringId}/regenerate-code`, {
                     method: 'POST', // Or PUT, depending on your API design
                     headers: {
                         'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                     }
                });

                if (response.ok) {
                    const result = await response.json();
                    currentEntryCodeSpan.textContent = result.newEntryCode; // Update the displayed code
                    alert('Entry Code regenerated successfully!');
                    loadOfferings(); // Refresh the table to show the new code (masked)
                } else {
                    const error = await response.json();
                    alert('Failed to regenerate code: ' + (error.message || response.statusText));
                }
             } catch (error) {
                 console.error('Error regenerating code:', error);
                 alert('An error occurred while regenerating the code.');
             }
        }
    });

    // Handle Regenerate Code button in the View Code Modal
    regenerateCodeFromViewModalBtn.addEventListener('click', async () => {
         if (confirm('Are you sure you want to regenerate the Entry Code? This will invalidate the old code and clients using it will lose access.')) {
              const offeringId = viewCodeModal.dataset.offeringId;
              if (!offeringId) return;

              try {
                 const response = await fetch(`/api/owner/offerings/${offeringId}/regenerate-code`, {
                      method: 'POST', // Or PUT
                      headers: {
                          'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                      }
                 });

                 if (response.ok) {
                     const result = await response.json();
                     displayEntryCodeSpan.textContent = result.newEntryCode; // Update the displayed code
                     alert('Entry Code regenerated successfully!');
                     loadOfferings(); // Refresh the table
                 } else {
                     const error = await response.json();
                     alert('Failed to regenerate code: ' + (error.message || response.statusText));
                 }
              } catch (error) {
                  console.error('Error regenerating code:', error);
                  alert('An error occurred while regenerating the code.');
              }
         }
     });


    // Function to load offerings (Conceptual)
    async function loadOfferings() {
        console.log('Loading offerings from backend...');
        try {
            const response = await fetch('/api/owner/offerings', {
                 headers: {
                    'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Replace with actual auth token
                }
            }); // Replace with your actual API endpoint
            if (response.ok) {
                const offerings = await response.json();
                renderOfferingsTable(offerings);
            } else {
                 const error = await response.json();
                console.error('Failed to fetch offerings:', error);
                // Display an error message to the user
                 offeringsTableBody.innerHTML = `<tr><td colspan="8">Error loading offerings: ${error.message || response.statusText}</td></tr>`;
            }
        } catch (error) {
            console.error('Error loading offerings:', error);
             offeringsTableBody.innerHTML = `<tr><td colspan="8">An error occurred while loading offerings.</td></tr>`;
        }
         // Example static data (replace with actual fetch from backend)
         /*
        const staticOfferings = [
            { _id: '1', name: 'Premium Gym Access', description: 'Full access to gym facilities.', paymentPlans: [{type: 'monthly', amount: 50}, {type: 'yearly', amount: 500}], entryCode: 'XYZ123ABC', status: 'active', clientsEnrolled: 55 },
            { _id: '2', name: 'Beginner Yoga - Weekend Batch', description: 'Yoga classes every Saturday and Sunday.', paymentPlans: [{type: 'monthly', amount: 80}], entryCode: 'DEF456GHI', status: 'active', clientsEnrolled: 30 },
            { _id: '3', name: 'Advanced Python Training', description: 'Intensive 3-month Python course.', paymentPlans: [{type: 'quarterly', amount: 1200}], entryCode: 'JKL789MNO', status: 'inactive', clientsEnrolled: 0 }
        ];
        renderOfferingsTable(staticOfferings);
        */
    }

    // Function to render the offerings table
    function renderOfferingsTable(offerings) {
        offeringsTableBody.innerHTML = ''; // Clear existing rows
        if (offerings.length === 0) {
            offeringsTableBody.innerHTML = '<tr><td colspan="8">No offerings found.</td></tr>';
            return;
        }
        offerings.forEach(offering => {
            const row = document.createElement('tr');
            row.classList.add('border-b', 'border-gray-200', 'dark:border-gray-700', 'hover:bg-gray-50', 'dark:hover:bg-gray-800/50', 'transition');
            row.innerHTML = `
                <td class="py-4 px-4">
                    <div class="font-medium text-gray-900 dark:text-white">${offering.name}</div>
                </td>
                <td class="py-4 px-4 max-w-xs">
                    <div class="text-gray-600 dark:text-gray-400 truncate">${offering.description}</div>
                </td>
                <td class="py-4 px-4">
                    <div class="font-medium text-indigo-600 dark:text-indigo-400">${offering.serviceId || 'N/A'}</div>
                </td>
                <td class="py-4 px-4">
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        ${offering.paymentPlans.map(p => 
                            `<div class="mb-1">
                                <span class="font-medium">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}:</span> 
                                <span class="text-green-600 dark:text-green-400">₹${p.amount}</span>
                            </div>`
                        ).join('')}
                    </div>
                </td>
                <td class="py-4 px-4 entry-code">
                    <div class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                        <span>**********</span> 
                        <button class="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 view-code-btn" data-code="${offering.entryCode || 'N/A'}">View</button>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${offering.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
                        ${offering.status.charAt(0).toUpperCase() + offering.status.slice(1)}
                    </span>
                </td>
                <td class="py-4 px-4 text-center">
                    <div>${offering.clientsEnrolled || 0}</div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex space-x-2">
                        <button class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 edit-offering-btn" data-id="${offering._id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 delete-offering-btn" data-id="${offering._id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            offeringsTableBody.appendChild(row);
        });
    }

    // Initial load of offerings when the page loads
    loadOfferings();

});
// Add this to your server.js file

// Client token verification endpoint
app.get('/api/client/verify', verifyToken, async (req, res) => {
    try {
        // Check if this client exists in database
        const client = await Client.findOne({ _id: req.user.id });
        
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        
        // Return minimal client data on successful verification
        res.status(200).json({ 
            verified: true,
            client: {
                id: client._id,
                fullName: client.fullname,
                email: client.email,
                mobile: client.mobile,
                city: client.city,
                state: client.state
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});