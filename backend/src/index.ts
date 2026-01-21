import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config(); // Load environment variables from .env file

// Basic type definition for an appointment
interface Appointment {
    id: string;
    date: string;
    time: string;
    status: 'free' | 'booked' | 'blocked';
    customerName?: string;
    customerEmail?: string;
}

// --- In-Memory Database ---
// This is a simple in-memory store. For a real application,
// you should replace this with a proper database like PostgreSQL, MongoDB, etc.
let appointments: Appointment[] = [];

// --- Appointment Generation Logic ---
const generateWeeklyAppointments = (): Appointment[] => {
    const slots: Appointment[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        
        let startHour = 13;
        let endHour = 19;
        if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
            endHour = 20;
        }

        for (let h = startHour; h <= endHour; h++) {
            slots.push({
                id: `${dateStr}-${h}`,
                date: dateStr,
                time: `${h}:00`,
                status: 'free'
            });
        }
    }
    return slots;
};

// Initialize appointments
appointments = generateWeeklyAppointments();


// --- Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Middleware to parse JSON bodies

// --- API Routes ---

app.get('/', (req, res) => {
    res.json({ message: 'MO STYLES backend is running!' });
});

// GET /api/appointments - Retrieve all appointments
app.get('/api/appointments', (req, res) => {
    res.json(appointments);
});

// POST /api/appointments/:id/book - Book a specific appointment
app.post('/api/appointments/:id/book', async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
        return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (appointments[appointmentIndex].status !== 'free') {
        return res.status(409).json({ error: 'Appointment is not available.' });
    }

    appointments[appointmentIndex] = {
        ...appointments[appointmentIndex],
        status: 'booked',
        customerName: name,
        customerEmail: email
    };

    const bookedAppointment = appointments[appointmentIndex];
    let webhookStatus = 'skipped';

    // --- Send Webhook to make.com if URL is configured ---
    if (WEBHOOK_URL) {
        try {
            const webhookResponse = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'appointmentBooked',
                    appointment: bookedAppointment
                })
            });

            if (webhookResponse.ok) {
                webhookStatus = 'success';
                console.log('Webhook sent successfully.');
            } else {
                webhookStatus = `failed: ${webhookResponse.status} ${webhookResponse.statusText}`;
                console.error('Failed to send webhook:', webhookResponse.status, webhookResponse.statusText);
            }
        } catch (error) {
            if (error instanceof Error) {
                webhookStatus = `failed: ${error.message}`;
            } else {
                webhookStatus = 'failed: An unknown error occurred';
            }
            console.error('Failed to send webhook:', error);
        }
    } else {
        console.warn('WEBHOOK_URL is not configured. Skipping webhook.');
    }

    res.json({ appointment: bookedAppointment, webhookStatus });
});

// POST /api/appointments/:id/toggle - Toggle an appointment's status (Admin)
app.post('/api/appointments/:id/toggle', (req, res) => {
    const { id } = req.params;
    const appointmentIndex = appointments.findIndex(apt => apt.id === id);

    if (appointmentIndex === -1) {
        return res.status(404).json({ error: 'Appointment not found.' });
    }

    const apt = appointments[appointmentIndex];
    
    // Cycle: free -> blocked -> free, and booked -> free
    if (apt.status === 'free') {
        apt.status = 'blocked';
    } else if (apt.status === 'blocked') {
        apt.status = 'free';
    } else if (apt.status === 'booked') {
        apt.status = 'free';
        apt.customerName = undefined;
        apt.customerEmail = undefined;
    }

    res.json(appointments[appointmentIndex]);
});

// POST /api/login - Admin Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    // IMPORTANT: This is insecure and for demonstration purposes only.
    // Use a secure authentication mechanism in a real application.
    if (password === 'admin') {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
