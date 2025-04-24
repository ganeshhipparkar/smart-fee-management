const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const clientRequests = require('./routes/clientRequests');
const requests = require('./routes/requests');

// Import models
const Client = require('./models/clientRegister');
const Owner = require('./models/ownerRegister');
const Request = require('./models/Request');

// Setup storage for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

// Static file serving - ensure all directories are properly accessible
app.use(express.static(path.join(__dirname)));
app.use('/clientUI', express.static(path.join(__dirname, 'clientUI')));
app.use('/ownerUI', express.static(path.join(__dirname, 'ownerUI')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    
    // Log more detailed error information
    if (err.name === 'MongoNetworkError') {
        console.error('MongoDB server may not be running. Please start MongoDB service.');
    } else if (err.name === 'MongoServerSelectionError') {
        console.error('Unable to select MongoDB server. Check if the connection string is correct.');
    }
});

// Client Registration Route
app.post('/api/register-client', async (req, res) => {
    try {
        const { 
            fullname, email, dob, gender, mobile, altMobile, 
            address, state, city, pincode, password, ownerId
        } = req.body;

        // Check if client already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new client with hashed password
        const newClient = new Client({
            fullname, 
            email, 
            dob, 
            gender, 
            mobile, 
            altMobile,
            address, 
            state, 
            city, 
            pincode, 
            password: hashedPassword,
            owner: ownerId  // Link client to owner
        });

        // Save client to database
        await newClient.save();
        
        res.status(201).json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
});

// Owner Registration Route - Updated to handle multiple payment settings
app.post('/api/register-owner', upload.fields([
    { name: 'businessDoc', maxCount: 1 }, 
    { name: 'taxDoc', maxCount: 1 }
]), async (req, res) => {
    try {
        const { 
            businessName, ownerName, businessEmail, businessPhone, businessAddress, 
            registrationNo, taxID, serviceName, serviceDescription, capacity, 
            businessType, otherBusinessType, password, serviceFee
        } = req.body;

        // Parse serviceFee as a number
        const parsedServiceFee = parseInt(serviceFee) || 0;
        if (parsedServiceFee <= 0) {
            return res.status(400).json({ success: false, message: 'Valid service fee is required' });
        }

        // Handle payment settings - properly parse JSON string from form data
        let paymentSettings = [];
        
        try {
            // Check if paymentSettings is provided as JSON string
            if (req.body.paymentSettings) {
                paymentSettings = JSON.parse(req.body.paymentSettings);
                console.log('Parsed payment settings:', paymentSettings);
            } 
            // Fallback to paymentSetting (singular) if paymentSettings is not available
            else if (req.body.paymentSetting) {
                paymentSettings = Array.isArray(req.body.paymentSetting)
                    ? req.body.paymentSetting
                    : [req.body.paymentSetting];
            }
            
            if (!Array.isArray(paymentSettings) || paymentSettings.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one payment setting is required' });
            }
            
            console.log('Payment settings processed:', paymentSettings);
        } catch (e) {
            console.error('Error parsing payment settings:', e);
            return res.status(400).json({ success: false, message: 'Invalid payment settings format' });
        }

        // Check if owner/business already exists
        const existingOwner = await Owner.findOne({ businessEmail });
        if (existingOwner) {
            return res.status(400).json({ success: false, message: 'Business email already registered' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Get file paths
        const businessDocPath = req.files.businessDoc ? req.files.businessDoc[0].path : null;
        const taxDocPath = req.files.taxDoc ? req.files.taxDoc[0].path : null;

        // Create new owner with payment settings as array
        const newOwner = new Owner({
            businessName,
            ownerName,
            businessEmail,
            businessPhone,
            businessAddress,
            registrationNo,
            taxID,
            serviceName,
            serviceDescription,
            capacity,
            businessType,
            otherBusinessType: businessType === 'other' ? otherBusinessType : null,
            paymentSettings, // Store as array
            paymentSetting: paymentSettings[0] || null, // Store first value for backward compatibility
            password: hashedPassword,
            businessDoc: businessDocPath,
            taxDoc: taxDocPath,
            serviceFee: parsedServiceFee // Use the parsed value
        });

        // Save owner to database
        await newOwner.save();
        
        res.status(201).json({ success: true, message: 'Business registration successful' });
    } catch (error) {
        console.error('Owner registration error:', error);
        // Log more details about the error for debugging
        if (error.name === 'ValidationError') {
            console.log('Validation error details:', error.errors);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: Object.keys(error.errors).map(field => ({
                    field,
                    message: error.errors[field].message
                }))
            });
        }
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
});

// Owner Login
app.post('/api/owner/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find owner by email
        const owner = await Owner.findOne({ businessEmail: email });
        if (!owner) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: owner._id, email: owner.businessEmail },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Return owner data (excluding password) and token
        const ownerData = {
            _id: owner._id,
            businessName: owner.businessName,
            ownerName: owner.ownerName,
            businessEmail: owner.businessEmail,
            businessPhone: owner.businessPhone,
            serviceName: owner.serviceName,
            businessType: owner.businessType,
            paymentSettings: owner.paymentSettings // Include payment settings in response
        };

        res.status(200).json({
            message: 'Login successful',
            owner: ownerData,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Client Login
app.post('/api/login-client', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find client by email
        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, client.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: client._id, email: client.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Return client data (excluding password) and token
        const clientData = {
            _id: client._id,
            fullName: client.fullname,  
            email: client.email,
            mobile: client.mobile,
            city: client.city,
            state: client.state
        };

        res.status(200).json({
            message: 'Login successful',
            client: clientData,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'clientRegister.html'));
});

app.get('/owner-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'ownerRegister.html'));
});

// Use routes
app.use('/api/client-requests', clientRequests);
app.use('/api/requests', requests);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const bearerHeader = req.headers['authorization'];
        
        if (!bearerHeader) {
            return res.status(401).json({ message: 'No authentication token provided' });
        }
        
        const token = bearerHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Owner token verification endpoint
app.get('/api/owner/verify', verifyToken, async (req, res) => {
    try {
        // Check if this owner exists in database
        const owner = await Owner.findOne({ _id: req.user.id });
        
        if (!owner) {
            return res.status(404).json({ message: 'Owner not found' });
        }
        
        // Return minimal owner data on successful verification
        res.status(200).json({ 
            verified: true,
            owner: {
                id: owner._id,
                businessName: owner.businessName,
                businessEmail: owner.businessEmail,
                paymentSettings: owner.paymentSettings // Include payment settings in response
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});

// API endpoint to get all clients
app.get('/api/clients', async (req, res) => {
    try {
        // Fetch all clients from the clientRegister collection
        const clients = await Client.find({});
        
        // Transform data to include only necessary fields
        const clientData = clients.map(client => ({
            id: client._id,
            fullname: client.fullname,
            email: client.email,
            mobile: client.mobile,
            address: client.address,
            city: client.city,
            state: client.state,
            pincode: client.pincode,
            paymentStatus: client.paymentStatus || 'pending',  // Default to pending if not set
            nextDueDate: client.nextDueDate || null,
            registrationDate: client.registrationDate
        }));
        
        res.status(200).json(clientData);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Server error while fetching clients' });
    }
});

// Get all owner services from the database
app.get('/api/owner-services', async (req, res) => {
    try {
        console.log('Fetching owner services...');
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
            throw new Error('Database connection is not established');
        }
        
        const owners = await Owner.find({});
        
        console.log('Found owners:', owners.length);
        
        // Return all owner data with success flag
        res.status(200).json({ 
            success: true, 
            services: owners 
        });
    } catch (error) {
        console.error('Error fetching owner services:', error);
        
        // Send a more detailed error message
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch services', 
            error: error.message,
            readyState: mongoose.connection.readyState
        });
    }
});

// Add new endpoint for handling enrollment requests
app.post('/api/requests/enroll', verifyToken, async (req, res) => {
    try {
        console.log('Enrollment request received:', req.body);
        console.log('User from token:', req.user);
        
        const { serviceId, planType, planAmount } = req.body;
        const clientId = req.user.id; // Get client ID from token
        
        // Validate inputs
        if (!serviceId || !planType || !planAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Find the service to get the owner ID
        const service = await Owner.findById(serviceId);
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        console.log('Service found:', {
            id: service._id,
            businessName: service.businessName,
            owner: service.ownerName
        });

        // Create the request with the owner's ID
        const newRequest = new Request({
            clientId,
            serviceId,
            ownerId: service._id, // Set the ownerId from the service
            planType,
            planAmount,
            status: 'pending'
        });

        const savedRequest = await newRequest.save();
        console.log('Request saved:', savedRequest);

        res.status(201).json({
            success: true,
            message: 'Enrollment request submitted successfully',
            request: savedRequest
        });
    } catch (error) {
        console.error('Error creating enrollment request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit enrollment request',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: {
            connected: dbConnected,
            state: mongoose.connection.readyState
        }
    });
});

// Test route for owner model
app.get('/api/test-owner-model', async (req, res) => {
    try {
        // Create a simple test owner object
        const testOwner = {
            businessName: 'Test Business',
            ownerName: 'Test Owner',
            businessEmail: `test${Date.now()}@example.com`, // Ensure unique email
            businessPhone: '1234567890',
            businessAddress: 'Test Address',
            registrationNo: 'TEST123',
            taxID: 'TAX123',
            serviceName: 'Test Service',
            capacity: 10,
            businessType: 'gym',
            paymentSettings: ['monthly', 'yearly'],
            password: 'hashedpassword',
            serviceFee: 1000
        };
        
        // Validate the model without saving
        const owner = new Owner(testOwner);
        const validationError = owner.validateSync();
        
        if (validationError) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: validationError.errors 
            });
        }
        
        // If validation passes, we're good
        res.status(200).json({ 
            success: true, 
            message: 'Owner model validation successful',
            schema: Object.keys(owner.schema.paths)
        });
    } catch (error) {
        console.error('Test owner model error:', error);
        res.status(500).json({ success: false, message: 'Test failed', error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});


