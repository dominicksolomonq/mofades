import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminProps, GalleryItem, Review } from '../types';
import { AdminCalendar } from './AdminCalendar';

// Analytics data type
interface AnalyticsData {
    totalVisits: number;
    todayViews: number;
    last7Days: { date: string; count: number }[];
    todayByHour: { hour: string; count: number }[];
    recentViews: { id: string; timestamp: string; page: string; referrer?: string }[];
}

export const AdminOverlay: React.FC<AdminProps> = ({ isOpen, onClose, appointments, onToggleSlot }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Gallery state
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]); // Added for reviews state
    const [activeTab, setActiveTab] = useState<'termine' | 'kalender' | 'analytics' | 'galerie' | 'reviews'>('termine');
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [galleryViewMode, setGalleryViewMode] = useState<'inbox' | 'live'>('inbox');

    // Handle visibility transitions
    React.useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await fetch('/api/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    // Fetch analytics/gallery/reviews when tab is selected
    useEffect(() => {
        if (isLoggedIn) {
            if (activeTab === 'analytics') fetchAnalytics();
            if (activeTab === 'galerie') fetchGallery();
            if (activeTab === 'reviews') fetchReviews();
        }
    }, [isLoggedIn, activeTab, fetchAnalytics]); // added fetchReviews to deps implicitly via useCallback or just ignore lint? Better to include it if stable.

    const fetchGallery = useCallback(async () => {
        try {
            const res = await fetch('/api/gallery?admin=true');
            if (res.ok) setGalleryItems(await res.json());
        } catch (e) {
            console.error('Failed to fetch gallery', e);
        }
    }, []);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch('/api/reviews');
            if (res.ok) setReviews(await res.json());
        } catch (e) {
            console.error('Failed to fetch reviews', e);
        }
    }, []);

    const handleDeleteReview = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Kommentar wirklich löschen?')) {
            try {
                await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
                fetchReviews();
            } catch (e) { console.error(e); }
        }
    };

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/gallery/${id}/approve`, { method: 'POST' });
            fetchGallery();
        } catch (e) { console.error(e); }
    };

    const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Bild wirklich löschen?')) {
            try {
                await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
                fetchGallery();
            } catch (e) { console.error(e); }
        }
    };

    const uniqueDates = useMemo(() => {
        const dates = Array.from(new Set(appointments.map(a => a.date)));
        dates.sort();
        return dates;
    }, [appointments]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = appointments.length;
        const booked = appointments.filter(a => a.status === 'booked').length;
        const free = appointments.filter(a => a.status === 'free').length;
        const blocked = appointments.filter(a => a.status === 'blocked').length;
        return { total, booked, free, blocked };
    }, [appointments]);

    React.useEffect(() => {
        if (isOpen && isLoggedIn && uniqueDates.length > 0 && !selectedDate) {
            setSelectedDate(uniqueDates[0]);
        }
    }, [isOpen, isLoggedIn, uniqueDates, selectedDate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (response.ok) {
                setIsLoggedIn(true);
                setError(false);
            } else {
                setError(true);
            }
        } catch (error) {
            console.error('Login failed:', error);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsLoggedIn(false);
            setPassword('');
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 400); // Match animation duration
    }

    const formatDateLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' });
        const day = d.getDate();
        return { weekday, day };
    };

    const currentSlots = appointments.filter(a => a.date === selectedDate);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center admin-overlay-container ${isClosing ? 'admin-overlay-closing' : 'admin-overlay-open'}`}>
            {/* iOS 26 Style Background - With blur effect */}
            <div className={`absolute inset-0 admin-backdrop ${isClosing ? 'admin-backdrop-closing' : 'admin-backdrop-open'}`}></div>

            {/* Close Button - iOS 26 Style */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 rounded-full ios-close-btn flex items-center justify-center text-white/50 hover:text-white transition-all duration-300 z-50 group"
            >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {!isLoggedIn ? (
                /* Login Section - iOS 26 Style */
                <div className={`relative z-10 admin-content ${isClosing ? 'admin-content-closing' : 'admin-content-open'}`}>
                    <div className="w-[320px] md:w-[360px] flex flex-col items-center">
                        {/* Face ID / Lock Icon with glow */}
                        <div className="ios-icon-container mb-8">
                            <div className="ios-icon-glow"></div>
                            <div className="ios-icon-inner">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-white text-[28px] font-semibold text-center mb-2 tracking-tight ios-text-shadow">Admin</h2>
                        <p className="text-white/35 text-sm text-center mb-10 font-medium">Passwort eingeben</p>

                        <form onSubmit={handleLogin} className="w-full space-y-5">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                                    className={`
                                        w-full ios-input text-white text-center text-lg tracking-[4px] py-4 px-6 outline-none transition-all duration-300 placeholder-white/25
                                        ${error ? 'ios-input-error' : ''}
                                    `}
                                    placeholder="••••••••"
                                    autoFocus
                                />
                                <div className={`ios-input-focus-ring ${password ? 'opacity-100' : 'opacity-0'}`}></div>
                            </div>

                            {error && (
                                <div className="flex items-center justify-center gap-2 animate-shake">
                                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-400 text-sm font-medium">Falsches Passwort</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="w-full ios-button py-4 font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                ) : (
                                    <span className="tracking-wide">Anmelden</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* Admin Dashboard - iOS 26 Style - Mobile Optimized */
                <div className={`relative z-10 w-full h-full max-w-6xl p-3 md:p-6 flex flex-col overflow-hidden admin-content ${isClosing ? 'admin-content-closing' : 'admin-content-open'}`}>

                    {/* Header with Tab Navigation */}
                    <div className="text-center mb-3 md:mb-4 flex-shrink-0">
                        <h2 className="text-white text-xl md:text-3xl font-semibold mb-3 tracking-tight ios-text-shadow">
                            {activeTab === 'termine' ? 'Termine' : activeTab === 'kalender' ? 'Kalender' : activeTab === 'analytics' ? 'Aufrufe' : activeTab === 'galerie' ? 'Galerie' : 'Bewertungen'}
                        </h2>

                        {/* Tab Navigation */}
                        <div className="flex justify-center flex-wrap gap-2">
                            <div className="inline-flex bg-white/5 rounded-xl p-1 backdrop-blur-sm overflow-x-auto max-w-full">
                                <button
                                    onClick={() => setActiveTab('termine')}
                                    className={`px-3 py-2 text-[10px] md:text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === 'termine' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Termine
                                </button>
                                <button
                                    onClick={() => setActiveTab('kalender')}
                                    className={`px-3 py-2 text-[10px] md:text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === 'kalender' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Kalender
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`px-3 py-2 text-[10px] md:text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Aufrufe
                                </button>
                                <button
                                    onClick={() => setActiveTab('galerie')}
                                    className={`px-3 py-2 text-[10px] md:text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === 'galerie' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Galerie
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-3 py-2 text-[10px] md:text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === 'reviews' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Kommentare
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {activeTab === 'kalender' ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <AdminCalendar appointments={appointments} />
                        </div>
                    ) : activeTab === 'analytics' ? (
                        /* Analytics Dashboard */
                        <div className="flex-1 min-h-0 overflow-y-auto ios-scrollbar">
                            {analyticsLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                </div>
                            ) : analytics ? (
                                <div className="space-y-4 md:space-y-6">
                                    {/* Analytics Stats Cards */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="ios-stat-card-mobile group">
                                            <div className="ios-stat-icon-mobile" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                                                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-2xl md:text-4xl font-bold tracking-tight">{analytics.totalVisits}</p>
                                            <p className="text-white/40 text-[10px] md:text-xs font-medium tracking-wide uppercase">Gesamt Aufrufe</p>
                                        </div>

                                        <div className="ios-stat-card-mobile group">
                                            <div className="ios-stat-icon-mobile" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                                                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-white text-2xl md:text-4xl font-bold tracking-tight">{analytics.todayViews}</p>
                                            <p className="text-white/40 text-[10px] md:text-xs font-medium tracking-wide uppercase">Heute</p>
                                        </div>
                                    </div>

                                    {/* 7-Day Chart */}
                                    <div className="ios-stat-card-mobile p-4 md:p-6">
                                        <h3 className="text-white/60 text-xs md:text-sm font-medium mb-4 uppercase tracking-wider">Letzte 7 Tage</h3>
                                        <div className="flex items-end justify-between gap-2 h-32 md:h-40">
                                            {analytics.last7Days.map((day, index) => {
                                                const maxCount = Math.max(...analytics.last7Days.map(d => d.count), 1);
                                                const height = (day.count / maxCount) * 100;
                                                const dateObj = new Date(day.date);
                                                const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
                                                return (
                                                    <div key={day.date} className="flex flex-col items-center flex-1 gap-2">
                                                        <span className="text-white/60 text-[10px] md:text-xs font-medium">{day.count}</span>
                                                        <div
                                                            className="w-full rounded-t-lg transition-all duration-500"
                                                            style={{
                                                                height: `${Math.max(height, 4)}%`,
                                                                background: index === analytics.last7Days.length - 1
                                                                    ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                                                                    : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                                                                animationDelay: `${index * 50}ms`
                                                            }}
                                                        />
                                                        <span className="text-white/40 text-[8px] md:text-[10px] font-medium uppercase">{dayName}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Recent Views */}
                                    <div className="ios-stat-card-mobile p-4 md:p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-white/60 text-xs md:text-sm font-medium uppercase tracking-wider">Letzte Besuche</h3>
                                            <button
                                                onClick={fetchAnalytics}
                                                className="text-white/40 hover:text-white transition-colors p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {analytics.recentViews.length > 0 ? (
                                                analytics.recentViews.map((view, index) => {
                                                    const timestamp = new Date(view.timestamp);
                                                    const timeStr = timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                                                    const dateStr = timestamp.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                                                    return (
                                                        <div
                                                            key={view.id}
                                                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                                                            style={{ animationDelay: `${index * 30}ms` }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                                <span className="text-white/80 text-sm">{view.page}</span>
                                                            </div>
                                                            <span className="text-white/40 text-xs">{dateStr} {timeStr}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-white/30 text-sm text-center py-4">Noch keine Besuche aufgezeichnet</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Note */}
                                    <div className="text-center py-2">
                                        <p className="text-white/20 text-[10px] md:text-xs">
                                            📊 Daten werden in Echtzeit aktualisiert
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-white/40 text-sm">Keine Daten verfügbar</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'galerie' ? (
                        /* Gallery Moderation - Complex Dashboard */
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            {/* Sub-Navigation (Inbox vs Live) */}
                            <div className="flex justify-center mb-4 flex-shrink-0">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl flex gap-1 shadow-lg">
                                    <button
                                        onClick={() => setGalleryViewMode('inbox')}
                                        className={`px-6 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${galleryViewMode === 'inbox' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Eingang
                                        {galleryItems.filter(i => i.status === 'pending').length > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${galleryViewMode === 'inbox' ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>
                                                {galleryItems.filter(i => i.status === 'pending').length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setGalleryViewMode('live')}
                                        className={`px-6 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${galleryViewMode === 'live' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Live
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${galleryViewMode === 'live' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}>
                                            {galleryItems.filter(i => i.status === 'approved').length}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Gallery Content Area */}
                            <div className="flex-1 overflow-y-auto ios-scrollbar p-1">
                                {galleryViewMode === 'inbox' ? (
                                    /* --- INBOX / PENDING VIEW --- */
                                    <div className="space-y-4 max-w-2xl mx-auto">
                                        {galleryItems.filter(i => i.status === 'pending').length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-64 text-white/30">
                                                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm">Alles erledigt! Keine offenen Anfragen.</p>
                                            </div>
                                        ) : (
                                            galleryItems.filter(i => i.status === 'pending').map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="bg-[#1C1C1E] border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-in flex flex-col md:flex-row"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    {/* Image Preview */}
                                                    <div className="w-full md:w-48 aspect-square md:aspect-auto relative group cursor-zoom-in bg-black">
                                                        <img src={item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                                                    </div>

                                                    {/* Details & Actions */}
                                                    <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    {/* User Avatar (Generated) */}
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600`}>
                                                                        {item.username.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-white font-semibold text-sm">{item.username}</h4>
                                                                        <p className="text-white/40 text-[10px]">@{item.username.toLowerCase().replace(/\s/g, '')} • Wartet auf Freigabe</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-white/30 text-[10px] font-mono bg-white/5 px-2 py-1 rounded">
                                                                    {new Date(item.timestamp).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <div className="h-px bg-white/5 my-3"></div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-3 mt-2">
                                                            <button
                                                                onClick={(e) => handleDeleteImage(item.id, e)}
                                                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/60 text-xs font-semibold transition-all border border-white/5 hover:border-red-500/30 flex items-center justify-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Ablehnen
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleApprove(item.id, e)}
                                                                className="flex-[2] py-3 rounded-xl bg-white text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] text-xs font-bold transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                </svg>
                                                                Freigeben
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    /* --- LIVE VIEW --- */
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {galleryItems.filter(i => i.status === 'approved').map(item => (
                                            <div key={item.id} className="relative group rounded-xl overflow-hidden bg-black aspect-square border border-white/10 shadow-lg">
                                                <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />

                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                                    <p className="text-white text-xs font-semibold truncate">{item.username}</p>
                                                    <p className="text-white/40 text-[10px] mb-2">{new Date(item.timestamp).toLocaleDateString()}</p>

                                                    <button
                                                        onClick={(e) => handleDeleteImage(item.id, e)}
                                                        className="w-full py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-[10px] uppercase font-bold rounded border border-red-500/30 transition-colors backdrop-blur-sm"
                                                    >
                                                        Löschen
                                                    </button>
                                                </div>

                                                {/* Live Badge */}
                                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                                            </div>
                                        ))}
                                        {galleryItems.filter(i => i.status === 'approved').length === 0 && (
                                            <div className="col-span-full py-12 text-center text-white/30 text-xs">
                                                Keine aktiven Bilder in der Galerie.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'reviews' ? (
                        /* Reviews Management */
                        <div className="flex-1 min-h-0 overflow-y-auto ios-scrollbar p-1">
                            {reviews.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-white/30 text-sm">Keine Bewertungen vorhanden.</div>
                            ) : (
                                <div className="space-y-3 max-w-2xl mx-auto">
                                    {reviews.map((review, index) => (
                                        <div key={review.id} className="bg-[#1C1C1E] border border-white/10 rounded-xl p-4 flex gap-4 items-start animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                            {/* Avatar or Icon */}
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white/50 shrink-0">
                                                <i className="fas fa-user"></i>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white font-bold text-sm">{review.username}</span>
                                                    <div className="flex gap-0.5 text-yellow-500 text-[10px]">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <i key={i} className={`fas fa-star ${i < review.stars ? '' : 'text-zinc-700'}`}></i>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-white/80 text-sm">{review.text || <span className="opacity-50 italic">Kein Text</span>}</p>
                                                <p className="text-white/30 text-[10px] mt-2">{new Date(review.timestamp).toLocaleDateString()} • {new Date(review.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteReview(review.id, e)}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                                                title="Löschen"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards - Compact Mobile Grid */}
                            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6 flex-shrink-0">
                                <div className="ios-stat-card-mobile group">
                                    <div className="ios-stat-icon-mobile ios-stat-icon-total">
                                        <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-lg md:text-2xl font-bold tracking-tight">{stats.total}</p>
                                    <p className="text-white/40 text-[9px] md:text-xs font-medium tracking-wide uppercase">Gesamt</p>
                                </div>

                                <div className="ios-stat-card-mobile group">
                                    <div className="ios-stat-icon-mobile ios-stat-icon-free">
                                        <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-lg md:text-2xl font-bold tracking-tight">{stats.free}</p>
                                    <p className="text-white/40 text-[9px] md:text-xs font-medium tracking-wide uppercase">Frei</p>
                                </div>

                                <div className="ios-stat-card-mobile group">
                                    <div className="ios-stat-icon-mobile ios-stat-icon-booked">
                                        <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-lg md:text-2xl font-bold tracking-tight">{stats.booked}</p>
                                    <p className="text-white/40 text-[9px] md:text-xs font-medium tracking-wide uppercase">Gebucht</p>
                                </div>

                                <div className="ios-stat-card-mobile group">
                                    <div className="ios-stat-icon-mobile ios-stat-icon-blocked">
                                        <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <p className="text-white text-lg md:text-2xl font-bold tracking-tight">{stats.blocked}</p>
                                    <p className="text-white/40 text-[9px] md:text-xs font-medium tracking-wide uppercase">Blockiert</p>
                                </div>
                            </div>

                            {/* Date Pills - Compact Horizontal Scroll */}
                            <div className="ios-date-container-mobile mb-3 md:mb-4 flex-shrink-0">
                                <div className="flex gap-1.5 md:gap-2 min-w-max md:justify-center py-0.5 px-0.5">
                                    {uniqueDates.map((date, index) => {
                                        const { weekday, day } = formatDateLabel(date);
                                        return (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`
                                            ios-date-pill-mobile animate-fade-scale flex flex-col items-center py-2 px-3 md:py-3 md:px-5 transition-all duration-300
                                            ${selectedDate === date ? 'ios-date-pill-active' : ''}
                                        `}
                                            >
                                                <span className={`text-[8px] md:text-[10px] font-semibold uppercase tracking-wider mb-0.5 transition-colors duration-300 ${selectedDate === date ? 'text-black/60' : 'text-white/40'}`}>
                                                    {weekday}
                                                </span>
                                                <span className={`text-base md:text-xl font-bold transition-colors duration-300 ${selectedDate === date ? 'text-black' : 'text-white'}`}>
                                                    {day}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Slots Grid - Fills remaining space with internal scroll if needed */}
                            <div className="flex-1 min-h-0 overflow-y-auto ios-scrollbar">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3 pb-2">
                                    {currentSlots.map((apt, index) => (
                                        <div
                                            key={apt.id}
                                            onClick={() => onToggleSlot(apt.id)}
                                            style={{ animationDelay: `${index * 25}ms` }}
                                            className={`
                                        ios-slot-card-mobile animate-fade-scale cursor-pointer group
                                        ${apt.status === 'free' ? 'ios-slot-free' : ''}
                                        ${apt.status === 'booked' ? 'ios-slot-booked' : ''}
                                        ${apt.status === 'blocked' ? 'ios-slot-blocked' : ''}
                                    `}
                                        >
                                            <div className="flex justify-between items-center mb-1 md:mb-2">
                                                <span className="text-white font-bold text-sm md:text-lg tracking-tight">{apt.time}</span>
                                                <span className={`
                                            ios-status-dot-mobile
                                            ${apt.status === 'free' ? 'ios-dot-free' : ''}
                                            ${apt.status === 'booked' ? 'ios-dot-booked' : ''}
                                            ${apt.status === 'blocked' ? 'ios-dot-blocked' : ''}
                                        `}></span>
                                            </div>

                                            {apt.status === 'booked' && (
                                                <div className="flex flex-col">
                                                    <span className="text-white/90 text-[10px] md:text-xs font-medium truncate">{apt.customerName || 'Unbekannt'}</span>
                                                </div>
                                            )}

                                            {apt.status === 'free' && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                    <span className="text-white/50 text-[10px] md:text-xs font-medium">Frei</span>
                                                </div>
                                            )}

                                            {apt.status === 'blocked' && (
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-white/30 text-[10px] md:text-xs font-medium">Gesperrt</span>
                                                </div>
                                            )}

                                            {/* Hover indicator - hidden on mobile */}
                                            <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block">
                                                <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Hint - Compact */}
                            <div className="text-center mt-2 md:mt-3 flex items-center justify-center gap-1.5 flex-shrink-0">
                                <svg className="w-3 h-3 md:w-4 md:h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                                </svg>
                                <span className="text-white/20 text-[10px] md:text-xs font-medium tracking-wide">Tippen zum Ändern</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                /* Admin Overlay Animations */
                .admin-overlay-container {
                    perspective: 1000px;
                }

                /* Backdrop animations */
                .admin-backdrop {
                    background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
                }
                .admin-backdrop-open {
                    animation: backdropOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .admin-backdrop-closing {
                    animation: backdropClose 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
                }

                @keyframes backdropOpen {
                    from {
                        opacity: 0;
                        backdrop-filter: blur(0px);
                    }
                    to {
                        opacity: 1;
                        backdrop-filter: blur(20px);
                    }
                }
                @keyframes backdropClose {
                    from {
                        opacity: 1;
                        backdrop-filter: blur(20px);
                    }
                    to {
                        opacity: 0;
                        backdrop-filter: blur(0px);
                    }
                }

                /* Content animations */
                .admin-content-open {
                    animation: contentOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .admin-content-closing {
                    animation: contentClose 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
                }

                @keyframes contentOpen {
                    from {
                        opacity: 0;
                        transform: scale(0.92) translateY(20px);
                        filter: blur(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                        filter: blur(0px);
                    }
                }
                @keyframes contentClose {
                    from {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                        filter: blur(0px);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.95) translateY(-10px);
                        filter: blur(10px);
                    }
                }

                /* Close Button */
                .ios-close-btn {
                    background: rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .ios-close-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                /* Icon Container */
                .ios-icon-container {
                    position: relative;
                    width: 72px;
                    height: 72px;
                }
                .ios-icon-glow {
                    position: absolute;
                    inset: -4px;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
                    border-radius: 24px;
                    animation: pulseGlow 3s ease-in-out infinite;
                }
                .ios-icon-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }

                /* Input Field */
                .ios-input {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .ios-input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
                }
                .ios-input-error {
                    border-color: rgba(239, 68, 68, 0.5) !important;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
                }

                /* Button */
                .ios-button {
                    background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%);
                    color: #000;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
                .ios-button:hover:not(:disabled) {
                    background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
                .ios-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                /* Stat Cards */
                .ios-stat-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 20px;
                    text-align: center;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ios-stat-card:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%);
                    border-color: rgba(255, 255, 255, 0.12);
                    transform: translateY(-2px);
                }

                .ios-stat-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px;
                }
                .ios-stat-icon-total { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
                .ios-stat-icon-free { background: rgba(52, 211, 153, 0.2); color: #34d399; }
                .ios-stat-icon-booked { background: rgba(255, 255, 255, 0.15); color: #ffffff; }
                .ios-stat-icon-blocked { background: rgba(107, 114, 128, 0.2); color: #6b7280; }

                /* Mobile Stat Cards */
                .ios-stat-card-mobile {
                    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 12px;
                    padding: 8px 6px;
                    text-align: center;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @media (min-width: 768px) {
                    .ios-stat-card-mobile {
                        border-radius: 16px;
                        padding: 14px 12px;
                    }
                }
                .ios-stat-card-mobile:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                .ios-stat-icon-mobile {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 4px;
                }
                @media (min-width: 768px) {
                    .ios-stat-icon-mobile {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        margin: 0 auto 8px;
                    }
                }

                /* Date Container - Mobile */
                .ios-date-container-mobile {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 14px;
                    padding: 4px;
                    overflow-x: auto;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                @media (min-width: 768px) {
                    .ios-date-container-mobile {
                        border-radius: 18px;
                        padding: 6px;
                    }
                }
                .ios-date-container-mobile::-webkit-scrollbar {
                    display: none;
                }
                .ios-date-container-mobile {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                /* Date Pills - Mobile */
                .ios-date-pill-mobile {
                    border-radius: 10px;
                    min-width: 42px;
                    background: transparent;
                    border: 1px solid transparent;
                }
                @media (min-width: 768px) {
                    .ios-date-pill-mobile {
                        border-radius: 14px;
                        min-width: 56px;
                    }
                }
                .ios-date-pill-mobile:hover:not(.ios-date-pill-active) {
                    background: rgba(255, 255, 255, 0.06);
                }
                .ios-date-pill-active {
                    background: linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%) !important;
                    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15);
                }

                /* Slot Cards - Mobile */
                .ios-slot-card-mobile {
                    position: relative;
                    padding: 10px 8px;
                    border-radius: 12px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                }
                @media (min-width: 768px) {
                    .ios-slot-card-mobile {
                        padding: 14px 12px;
                        border-radius: 16px;
                    }
                }

                /* Status Dots - Mobile */
                .ios-status-dot-mobile {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                @media (min-width: 768px) {
                    .ios-status-dot-mobile {
                        width: 8px;
                        height: 8px;
                    }
                }

                /* Original Date Container (keeping for reference) */
                .ios-date-container {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 6px;
                    overflow-x: auto;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .ios-date-container::-webkit-scrollbar {
                    display: none;
                }
                .ios-date-container {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                /* Date Pills */
                .ios-date-pill {
                    border-radius: 14px;
                    min-width: 56px;
                    background: transparent;
                    border: 1px solid transparent;
                }
                .ios-date-pill:hover:not(.ios-date-pill-active) {
                    background: rgba(255, 255, 255, 0.06);
                }

                /* Slot Cards */
                .ios-slot-card {
                    position: relative;
                    padding: 16px;
                    border-radius: 18px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid transparent;
                }
                .ios-slot-free {
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                    border-color: rgba(255, 255, 255, 0.06);
                }
                .ios-slot-free:hover {
                    background: linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.04) 100%);
                    border-color: rgba(52, 211, 153, 0.3);
                    transform: translateY(-2px);
                }
                .ios-slot-booked {
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%);
                    border-color: rgba(255, 255, 255, 0.12);
                }
                .ios-slot-booked:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                .ios-slot-blocked {
                    background: rgba(255, 255, 255, 0.02);
                    border-color: rgba(255, 255, 255, 0.03);
                    opacity: 0.5;
                }
                .ios-slot-blocked:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                /* Status Dots */
                .ios-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .ios-dot-free {
                    background: #34d399;
                    box-shadow: 0 0 8px rgba(52, 211, 153, 0.5);
                }
                .ios-dot-booked {
                    background: #ffffff;
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
                }
                .ios-dot-blocked {
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Scrollbar */
                .ios-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .ios-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .ios-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .ios-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Text Shadow */
                .ios-text-shadow {
                    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
                }

                /* Animations */
                @keyframes fadeIn {
                    0% { opacity: 0; transform: scale(0.96) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes fadeScale {
                    0% { opacity: 0; transform: scale(0.92); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-scale {
                    animation: fadeScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    animation-fill-mode: both;
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
                }
            `}</style>
        </div>
    );
};