// In your Node.js server file (e.g., clientRoutes.js)

const express = require('express');
const router = express.Router();
const Client = require('../models/Client'); // Assuming a Mongoose model for Client
const Offering = require('../models/Offering'); // Need Offering model to get details
const jwt = require('jsonwebtoken'); // For authentication
const moment = require('moment'); // Good library for date calculations

// Middleware to verify JWT token (same as in offerings)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // if token is not valid
        req.user = user; // Contains user info from the token payload (e.g., owner ID)
        next();
    });
}

// Protect these routes with authentication
router.use(authenticateToken);

// Helper function to calculate next due date and status (Conceptual)
// This logic would need to be robust based on your payment plans
function calculatePaymentStatus(client) {
    if (!client.lastPaid) {
        // Logic for new clients or clients who never paid
        return { status: 'Pending First Payment', nextDue: 'N/A' };
    }

    // Assuming client.plan contains info like { type: 'monthly', amount: 50 }
    if (!client.plan || !client.plan.type) {
         return { status: 'No Plan Assigned', nextDue: 'N/A' };
    }

    let nextDueDate;
    const lastPaidMoment = moment(client.lastPaid);

    switch (client.plan.type) {
        case 'monthly':
            nextDueDate = lastPaidMoment.clone().add(1, 'month');
            break;
        case 'quarterly':
            nextDueDate = lastPaidMoment.clone().add(3, 'months');
            break;
        case 'half-yearly':
            nextDueDate = lastPaidMoment.clone().add(6, 'months');
            break;
        case 'yearly':
            nextDueDate = lastPaidMoment.clone().add(1, 'year');
            break;
        default:
             return { status: 'Invalid Plan Type', nextDue: 'N/A' };
    }

    const now = moment();
    const diffDays = nextDueDate.diff(now, 'days');

    let status = 'Current';
    if (diffDays <= 3 && diffDays > 0) {
        status = 'Upcoming';
    } else if (diffDays <= 0) {
        status = 'Overdue';
    }


    return {
        status: status,
        nextDue: nextDueDate.format('YYYY-MM-DD') // Format date as needed
    };
}


// GET all clients for the authenticated owner
// This endpoint needs to return data structured for the table
router.get('/', async (req, res) => {
    try {
        // Find clients associated with the logged-in owner
        // You might need to populate offering details if stored by reference
        const clients = await Client.find({ owner: req.user.ownerId })
                                    .populate('enrolledOffering'); // Assuming a reference to Offering model

        const clientsData = clients.map(client => {
            const { status, nextDue } = calculatePaymentStatus(client); // Calculate status dynamically

            return {
                id: client._id,
                name: client.name, // Assuming client has a 'name' field
                offerings: client.enrolledOffering ? (Array.isArray(client.enrolledOffering) ? client.enrolledOffering.map(o => o.name) : client.enrolledOffering.name) : 'N/A', // Get offering name(s)
                plan: client.plan ? `${client.plan.type.charAt(0).toUpperCase() + client.plan.type.slice(1)} ($${client.plan.amount})` : 'N/A',
                nextDue: nextDue,
                status: status,
                lastPaid: client.lastPaid ? moment(client.lastPaid).format('YYYY-MM-DD') : 'N/A', // Format date
                // Add other necessary fields for the table view
            };
        });

        res.json(clientsData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific client by ID for the authenticated owner
// This endpoint needs to return more detailed data for the modal
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, owner: req.user.ownerId })
                                   .populate('enrolledOffering') // Populate offering details
                                   .populate('paymentHistory'); // Assuming payment history is stored as sub-documents or referenced

        if (client == null) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const { status, nextDue } = calculatePaymentStatus(client); // Calculate status dynamically

        res.json({
            id: client._id,
            name: client.name,
            contact: client.contactInfo || 'N/A', // Assuming contactInfo field
            offerings: client.enrolledOffering ? (Array.isArray(client.enrolledOffering) ? client.enrolledOffering.map(o => o.name) : client.enrolledOffering.name) : 'N/A',
             plan: client.plan ? `${client.plan.type.charAt(0).toUpperCase() + client.plan.type.slice(1)} ($${client.plan.amount})` : 'N/A',
            nextDue: nextDue,
            status: status,
            lastPaid: client.lastPaid ? moment(client.lastPaid).format('YYYY-MM-DD') : 'N/A',
            history: client.paymentHistory || [] // Assuming paymentHistory is an array
            // Add other detailed client fields
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST endpoint to mark a client's current period as paid
router.post('/:id/mark-paid', async (req, res) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, owner: req.user.ownerId });
        if (client == null) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if the client has a plan
        if (!client.plan || !client.plan.type) {
             return res.status(400).json({ message: 'Client does not have an active payment plan assigned.' });
        }

        // --- Payment Marking Logic ---
        // This is simplified. A real system would handle payment gateway webhooks for QR payments.
        // This 'mark-paid' assumes a manual marking for cash/bank transfer or similar.

        const paymentAmount = client.plan.amount; // Get amount from the current plan
        const paymentDate = new Date(); // Date of marking

        // Add payment to history (assuming paymentHistory is an array of sub-documents)
        client.paymentHistory.push({
             date: paymentDate,
             amount: paymentAmount,
             method: 'Manual (Owner Marked)', // Indicate it was manually marked
             // txId: null // No transaction ID for manual payments
        });

        // Update the last paid date
        client.lastPaid = paymentDate;

        // The 'nextDue' and 'status' will be recalculated by the frontend on refresh
        // or by the backend GET endpoint when data is fetched again.

        const updatedClient = await client.save();

        res.json({ message: 'Payment marked as paid', client: updatedClient });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT endpoint to update client details (e.g., assign a new offering/plan)
// router.put('/:id', async (req, res) => { ... }); // Implement update logic here

// DELETE endpoint (Optional) - to remove a client
// router.delete('/:id', async (req, res) => { ... }); // Implement delete logic here


module.exports = router;