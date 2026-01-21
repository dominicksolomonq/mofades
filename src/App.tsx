import React, { useState, useEffect, useCallback } from 'react';
import { OverlayUI } from './components/OverlayUI';
import { GalleryOverlay } from './components/GalleryOverlay';
import { BookingOverlay } from './components/BookingOverlay';
import { AdminOverlay } from './components/AdminOverlay';
import { Experience } from './components/Experience';
import { Appointment } from './types';

const API_URL = 'http://localhost:3001';

const App: React.FC = () => {
    // UI State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    
    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    const [modelUrl, setModelUrl] = useState<string | null>(import.meta.env.VITE_MODEL_URL || '/test123.glb');
    
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // Fetch appointments from the backend
    const fetchAppointments = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments`);
            const data = await response.json();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
            // Optionally, set some error state to show in the UI
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Handlers that now interact with the backend
    const handleBookSlot = async (id: string, name: string, email: string) => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${id}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });
            const result = await response.json();
            fetchAppointments(); // Re-fetch to get the latest state
        } catch (error) {
            alert('An error occurred. Check the browser console (F12) for details.');
            console.error('[App.tsx] Failed to book slot:', error);
        }
    };

    const handleToggleSlot = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${id}/toggle`, {
                method: 'POST',
            });
            if (response.ok) {
                fetchAppointments(); // Re-fetch to get the latest state
            }
        } catch (error) {
            console.error('Failed to toggle slot:', error);
        }
    };

    return (
        <div className="relative w-screen h-screen bg-[#050505] overflow-hidden">
            
            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0">
                <Experience 
                    url={modelUrl} 
                    onLoad={() => setIsModelLoaded(true)}
                    onError={() => {
                        console.warn("Failed to load model. Please ensure 'test123.glb' is in your public folder.");
                        setIsModelLoaded(false);
                    }}
                />
            </div>

            {/* Main UI Layer */}
            <OverlayUI 
                onOpenGallery={() => setIsGalleryOpen(true)} 
                onOpenBooking={() => setIsBookingOpen(true)}
                onOpenAdmin={() => setIsAdminOpen(true)}
                modelLoaded={isModelLoaded}
            />

            {/* Overlays */}
            <GalleryOverlay 
                isOpen={isGalleryOpen} 
                onClose={() => setIsGalleryOpen(false)} 
            />
            
            <BookingOverlay 
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                appointments={appointments}
                onBookSlot={handleBookSlot}
            />

            <AdminOverlay 
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                appointments={appointments}
                onToggleSlot={handleToggleSlot}
            />
            
        </div>
    );
};

export default App;