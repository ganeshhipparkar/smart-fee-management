// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint for Dashboard Data (Example) ---
app.get('/api/dashboard-data', (req, res) => {
    // In a real app, fetch this data from your database (MongoDB)
    const dummyData = {
        kpis: {
            upcomingCount: 8,
            upcomingTotal: 15000, // Assuming INR or your currency
            overdueCount: 3,
            overdueTotal: 5500,
            activeClients: 75,
            revenueThisMonth: 85000,
        },
        overduePayments: [
            { id: 1, clientName: 'Amit Sharma', serviceName: 'Gym Membership', amount: 2000, dueDate: '2025-04-15', daysOverdue: 5 },
            { id: 2, clientName: 'Priya Singh', serviceName: 'Yoga Class', amount: 1500, dueDate: '2025-04-18', daysOverdue: 2 },
            { id: 3, clientName: 'Rahul Verma', serviceName: 'Python Course', amount: 2000, dueDate: '2025-04-10', daysOverdue: 10 },
        ],
        upcomingPayments: [
            { id: 4, clientName: 'Sneha Reddy', serviceName: 'Music Class', amount: 1800, dueDate: '2025-04-22' },
            { id: 5, clientName: 'Vikram Kumar', serviceName: 'Gym Membership', amount: 2000, dueDate: '2025-04-23' },
            { id: 6, clientName: 'Anjali Mehta', serviceName: 'Yoga Class', amount: 1500, dueDate: '2025-04-25' },
            { id: 7, clientName: 'Rohan Gupta', serviceName: 'Advanced Java', amount: 3000, dueDate: '2025-04-28' },
            { id: 8, clientName: 'Aditi Rao', serviceName: 'Music Class', amount: 1800, dueDate: '2025-04-30' },
        ]
    };
    res.json(dummyData);
});

// --- Serve the main HTML file for the root route ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Note: Using current date for example. The date is April 20, 2025.
    console.log(`Current Date reference for dummy data: 2025-04-20`);
});

//-----------------------------------------------------------------------------------------------------------------------------------------------------------


// server.js or offeringsRoutes.js

const express = require('express');
const router = express.Router();
const Offering = require('../models/Offering'); // Assuming a Mongoose model for Offering
const jwt = require('jsonwebtoken'); // For authentication
const { v4: uuidv4 } = require('uuid'); // For generating unique entry codes

// Middleware to verify JWT token
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

// GET all offerings for the authenticated owner
router.get('/', async (req, res) => {
    try {
        // Find offerings belonging to the logged-in owner
        const offerings = await Offering.find({ owner: req.user.ownerId }); // Assuming owner ID is stored in the token
        res.json(offerings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific offering by ID for the authenticated owner
router.get('/:id', async (req, res) => {
    try {
        const offering = await Offering.findOne({ _id: req.params.id, owner: req.user.ownerId });
        if (offering == null) {
            return res.status(404).json({ message: 'Offering not found' });
        }
        res.json(offering);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create a new offering for the authenticated owner
router.post('/', async (req, res) => {
    const offering = new Offering({
        owner: req.user.ownerId, // Assign the offering to the logged-in owner
        name: req.body.name,
        description: req.body.description,
        paymentPlans: req.body.paymentPlans, // Array of { type, amount }
        entryCode: uuidv4(), // Generate a unique entry code
        status: req.body.status || 'active', // Default status
        serviceId: req.body.serviceId // Add service ID 
        // clientsEnrolled would start at 0
    });

    try {
        const newOffering = await offering.save();
        res.status(201).json(newOffering);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update an existing offering for the authenticated owner
router.put('/:id', async (req, res) => {
    try {
        const offering = await Offering.findOne({ _id: req.params.id, owner: req.user.ownerId });
        if (offering == null) {
            return res.status(404).json({ message: 'Offering not found' });
        }

        // Update fields that are allowed to be updated
        offering.name = req.body.name || offering.name;
        offering.description = req.body.description || offering.description;
        offering.paymentPlans = req.body.paymentPlans || offering.paymentPlans;
        offering.status = req.body.status || offering.status;
        // Update service ID if it's provided
        if (req.body.serviceId) {
            offering.serviceId = req.body.serviceId;
        }
        // Do NOT update entryCode here, use a separate endpoint for regeneration

        const updatedOffering = await offering.save();
        res.json(updatedOffering);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST regenerate entry code for an offering
router.post('/:id/regenerate-code', async (req, res) => {
     try {
        const offering = await Offering.findOne({ _id: req.params.id, owner: req.user.ownerId });
        if (offering == null) {
            return res.status(404).json({ message: 'Offering not found' });
        }

        offering.entryCode = uuidv4(); // Generate a new unique code

        const updatedOffering = await offering.save();
        res.json({ message: 'Entry code regenerated successfully', newEntryCode: updatedOffering.entryCode });
     } catch (err) {
        res.status(500).json({ message: err.message });
     }
});


// DELETE an offering for the authenticated owner
router.delete('/:id', async (req, res) => {
    try {
        const offering = await Offering.findOne({ _id: req.params.id, owner: req.user.ownerId });
        if (offering == null) {
            return res.status(404).json({ message: 'Offering not found' });
        }

        // Consider if you need to handle associated clients (e.g., mark them inactive or prompt the owner)
        // For simplicity here, we'll just delete the offering
        await offering.deleteOne();
        res.json({ message: 'Offering deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check if a service ID is unique (for generating new IDs)
router.get('/check-id/:serviceId', async (req, res) => {
    try {
        const isUnique = await Offering.isServiceIdUnique(req.params.serviceId);
        res.json({ isUnique });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;