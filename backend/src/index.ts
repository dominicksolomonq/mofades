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

// Type definition for page views (analytics)
interface PageView {
    id: string;
    timestamp: Date;
    page: string;
    userAgent?: string;
    referrer?: string;
}

// --- In-Memory Database ---
// This is a simple in-memory store. For a real application,
// you should replace this with a proper database like PostgreSQL, MongoDB, etc.
let appointments: Appointment[] = [];
let pageViews: PageView[] = [];
let totalVisits = 0;

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

// --- Analytics API Routes ---

// POST /api/analytics/pageview - Track a page view
app.post('/api/analytics/pageview', (req, res) => {
    const { page, referrer } = req.body;
    const userAgent = req.headers['user-agent'];

    const pageView: PageView = {
        id: `pv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        page: page || '/',
        userAgent: userAgent,
        referrer: referrer || undefined
    };

    pageViews.push(pageView);
    totalVisits++;

    // Keep only last 1000 page views to prevent memory issues
    if (pageViews.length > 1000) {
        pageViews = pageViews.slice(-1000);
    }

    res.json({ success: true, viewId: pageView.id });
});

// GET /api/analytics - Retrieve analytics data (Admin)
app.get('/api/analytics', (req, res) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get views for the last 7 days
    const last7Days: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = 0;
    }

    // Get views by hour for today
    const todayByHour: { [key: string]: number } = {};
    for (let h = 0; h < 24; h++) {
        todayByHour[`${h.toString().padStart(2, '0')}:00`] = 0;
    }

    // Aggregate page views
    pageViews.forEach(pv => {
        const pvDate = pv.timestamp.toISOString().split('T')[0];
        const pvHour = pv.timestamp.getHours().toString().padStart(2, '0') + ':00';

        // Count by day
        if (last7Days.hasOwnProperty(pvDate)) {
            last7Days[pvDate]++;
        }

        // Count by hour for today
        if (pvDate === today) {
            todayByHour[pvHour]++;
        }
    });

    // Calculate today's views
    const todayViews = pageViews.filter(pv =>
        pv.timestamp.toISOString().split('T')[0] === today
    ).length;

    // Get recent page views (last 10)
    const recentViews = pageViews.slice(-10).reverse().map(pv => ({
        id: pv.id,
        timestamp: pv.timestamp.toISOString(),
        page: pv.page,
        referrer: pv.referrer
    }));

    res.json({
        totalVisits,
        todayViews,
        last7Days: Object.entries(last7Days).map(([date, count]) => ({ date, count })),
        todayByHour: Object.entries(todayByHour).map(([hour, count]) => ({ hour, count })),
        recentViews
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
