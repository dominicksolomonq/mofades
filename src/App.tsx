import React, { useState, useEffect, useCallback } from 'react';
import { OverlayUI } from './components/OverlayUI';
import { GalleryOverlay } from './components/GalleryOverlay';
import { BookingOverlay } from './components/BookingOverlay';
import { AdminOverlay } from './components/AdminOverlay';
import { Experience } from './components/Experience';
import { Appointment } from './types';

const API_URL = '';

const App: React.FC = () => {
    // UI State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const [modelUrl, setModelUrl] = useState<string | null>(import.meta.env.VITE_MODEL_URL || '/test123.glb');

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [showPoster, setShowPoster] = useState(true);

    const handleModelLoad = () => {
        setIsModelLoaded(true);
        // Fade out poster slightly after model is ready for smooth transition
        setTimeout(() => setShowPoster(false), 800);
    };

    // Fetch appointments from the backend
    const fetchAppointments = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments`);
            const data = await response.json();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Track page view for analytics
    useEffect(() => {
        const trackPageView = async () => {
            try {
                await fetch(`${API_URL}/api/analytics/pageview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: window.location.pathname,
                        referrer: document.referrer || undefined
                    })
                });
            } catch (error) {
                console.debug('Analytics tracking failed:', error);
            }
        };
        trackPageView();
    }, []);

    // Handlers that now interact with the backend
    const handleBookSlot = async (id: string, name: string, email: string) => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${id}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });
            await response.json();
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
                    onLoad={handleModelLoad}
                    onError={() => {
                        console.warn("Failed to load model. Please ensure 'test123.glb' is in your public folder.");
                        setIsModelLoaded(false);
                        // Keep poster if fails? Or show error? For now, visuals are cleaner if we just keep poster or hide it.
                        // Let's hide it so they at least see the UI.
                        setShowPoster(false);
                    }}
                />
            </div>

            {/* Loading Poster - Immediate visual feedback */}
            <div className={`absolute inset-0 z-[5] flex items-center justify-center bg-[#050505] transition-opacity duration-1000 ${showPoster ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="relative flex flex-col items-center">
                    {/* Glow effect */}
                    <div className="absolute inset-0 transform scale-150 bg-white/5 blur-3xl rounded-full"></div>
                    <img src="/real logo website.png" alt="Loading Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 animate-pulse" />
                    <p className="text-white/20 text-xs mt-8 tracking-[4px] uppercase font-light">Loading Experience</p>
                </div>
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