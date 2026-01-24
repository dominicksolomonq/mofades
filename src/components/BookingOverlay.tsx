import React, { useState, useMemo, useEffect } from 'react';
import { BookingProps } from '../types';

export const BookingOverlay: React.FC<BookingProps> = ({ isOpen, onClose, appointments, onBookSlot }) => {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Extract unique dates and sort them
    const uniqueDates = useMemo(() => {
        const dates = Array.from(new Set(appointments.map(a => a.date)));
        dates.sort();
        return dates;
    }, [appointments]);

    // Set initial date when opening
    useEffect(() => {
        if (isOpen && uniqueDates.length > 0 && !selectedDate) {
            setSelectedDate(uniqueDates[0]);
        }
        if (!isOpen) {
            // Reset state on close
            setTimeout(() => {
                setSelectedSlot(null);
                setName('');
                setEmail('');
                setShowSuccess(false);
            }, 300);
        }
    }, [isOpen, uniqueDates, selectedDate]);

    // Filter slots for current view
    const currentSlots = appointments.filter(a => a.date === selectedDate);

    const playSuccessSound = () => {
        try {
            const audio = new Audio('/success.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Audio playback failed', e));
        } catch (e) {
            console.error('Sound error', e);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSlot && name.trim() && email.trim()) {
            onBookSlot(selectedSlot, name, email);
            setShowSuccess(true);
            playSuccessSound();

            // Auto close after animation
            setTimeout(() => {
                onClose();
            }, 2500);
        }
    };

    return (
        <div className={`fixed inset-0 z-40 flex items-end md:items-center justify-center booking-backdrop ${isOpen ? 'booking-backdrop-open' : 'booking-backdrop-closed'}`}>

            {/* Modal Container - Clean without shine glow */}
            <div className={`relative w-full md:w-[450px] bg-[#0D0D0F] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] booking-modal ${isOpen ? 'booking-modal-open' : 'booking-modal-closed'}`}>
                {/* Apple Pay Animation Container - Clean, no extra borders */}

                {/* Header */}
                <div className="flex justify-between items-center p-3 md:p-4 bg-[#2C2C2E]/50 border-b border-white/5">
                    <button onClick={onClose} className="text-white/70 hover:text-white text-base md:text-lg font-normal transition-colors duration-200">Abbrechen</button>
                    <h2 className="text-white font-semibold text-base md:text-lg">Termin</h2>
                    <div className="w-16"></div> {/* Spacer for center alignment */}
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 relative">

                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center h-full animate-pop-in relative z-10">
                            {/* Apple Pay Style Checkmark - Exact 1:1 Implementation */}
                            <div className="mb-6 relative w-24 h-24 flex items-center justify-center apple-icon-container">
                                <svg className="w-20 h-20" viewBox="0 0 52 52">
                                    <circle
                                        cx="26" cy="26" r="25" fill="none"
                                        className="apple-circle"
                                    />
                                    <path
                                        fill="none"
                                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                        className="apple-check"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-2 tracking-tight apple-text-reveal">Gebucht</h3>
                            <p className="text-zinc-400 text-sm apple-text-reveal-delayed text-center px-8 leading-relaxed">
                                Bestätigung wurde gesendet.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Slot Selection */}
                            {!selectedSlot ? (
                                <>
                                    {/* Date Picker (iOS Week View Style) - Futuristic */}
                                    <div className="flex overflow-x-auto gap-2 mb-4 md:mb-6 px-1 pb-2 no-scrollbar md:justify-between">
                                        {uniqueDates.map((date, index) => {
                                            const d = new Date(date);
                                            const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');
                                            const dayNum = d.getDate();
                                            const isSelected = selectedDate === date;

                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => setSelectedDate(date)}
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                    className={`day-pill flex flex-col flex-shrink-0 items-center justify-center w-10 h-14 md:w-11 md:h-16 rounded-xl transition-all duration-300 ${isSelected ? 'day-pill-selected' : 'day-pill-default'}`}
                                                >
                                                    <span className={`text-[10px] uppercase font-semibold mb-0.5 transition-all duration-300 ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>{dayName}</span>
                                                    <span className={`text-lg md:text-xl font-medium transition-all duration-300 ${isSelected ? 'text-black' : 'text-white'}`}>{dayNum}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <h3 className="text-white text-xs md:text-sm font-semibold mb-2 ml-1 uppercase tracking-wider text-zinc-500">Verfügbare Zeiten</h3>

                                    {/* Responsive Grid: 4 cols on mobile, 5 on desktop for smaller appearance */}
                                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2 mb-6">
                                        {currentSlots.map(apt => (
                                            <button
                                                key={apt.id}
                                                disabled={apt.status !== 'free'}
                                                onClick={() => setSelectedSlot(apt.id)}
                                                className={`
                                                    py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200
                                                    ${apt.status === 'free'
                                                        ? 'bg-[#2C2C2E] text-white hover:bg-[#3A3A3C] active:scale-95'
                                                        : 'bg-[#1C1C1E] text-zinc-600 border border-zinc-800 cursor-not-allowed'}
                                                `}
                                            >
                                                {apt.time}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Made by credit */}
                                    <div className="absolute bottom-3 right-4">
                                        <span className="text-[9px] text-zinc-700 italic opacity-50">made by domi</span>
                                    </div>

                                    {currentSlots.length === 0 && (
                                        <div className="text-center py-10 text-zinc-500">
                                            <i className="far fa-calendar-times text-4xl mb-3 block opacity-50"></i>
                                            Keine Termine verfügbar
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Step 2: Details Form */
                                <form onSubmit={handleSubmit} className="animate-slide-in">
                                    <div className="mb-6">
                                        <p className="text-zinc-400 text-xs uppercase mb-2 ml-4">Termin Details</p>
                                        <div className="bg-[#2C2C2E] rounded-xl overflow-hidden">
                                            <div className="flex justify-between items-center p-3 md:p-4 border-b border-[#3A3A3C]">
                                                <span className="text-white text-sm md:text-base">Datum</span>
                                                <span className="text-zinc-400 text-sm md:text-base">{new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 md:p-4">
                                                <span className="text-white text-sm md:text-base">Uhrzeit</span>
                                                <span className="text-white font-semibold text-sm md:text-base">{appointments.find(a => a.id === selectedSlot)?.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8 space-y-4">
                                        <p className="text-zinc-400 text-xs uppercase mb-2 ml-4">Ihre Daten</p>

                                        {/* Name Input */}
                                        <div className="group relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                                                <i className="far fa-user"></i>
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className="w-full bg-[#1C1C1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 pl-12 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-[#2C2C2E]/80 transition-all duration-300 shadow-sm focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                                placeholder="Vollständiger Name"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                        </div>

                                        {/* Email Input */}
                                        <div className="group relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors duration-300">
                                                <i className="far fa-envelope"></i>
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-[#1C1C1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 pl-12 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-[#2C2C2E]/80 transition-all duration-300 shadow-sm focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                                placeholder="E-Mail Adresse"
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSlot(null)}
                                            className="flex-1 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/5 text-zinc-300 py-3.5 rounded-xl font-medium active:scale-95 transition-all duration-200 text-sm md:text-base"
                                        >
                                            Zurück
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 relative overflow-hidden bg-white text-black py-3.5 rounded-xl font-semibold active:scale-95 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] text-sm md:text-base group"
                                        >
                                            <span className="relative z-10">Termin bestätigen</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                /* Apple Pay Animation CSS - Refined 1:1 Feel */
                .apple-icon-container {
                    animation: scalePulse 0.4s cubic-bezier(0.25, 1.5, 0.5, 1) 0.4s forwards;
                    opacity: 0;
                    animation-fill-mode: forwards;
                }
                
                /* Reveal container first */
                @keyframes scalePulse {
                    0% { opacity: 0; transform: scale(0.5); }
                    60% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .apple-circle {
                    stroke: #30d158;
                    stroke-width: 2.5;
                    stroke-miterlimit: 10;
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-linecap: round;
                    animation: stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
                }

                .apple-check {
                    stroke: #30d158;
                    stroke-width: 3.5;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    stroke-linejoin: round;
                    stroke-linecap: round;
                    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
                }

                .apple-text-reveal {
                    opacity: 0;
                    transform: translateY(10px);
                    animation: textFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
                }

                .apple-text-reveal-delayed {
                    opacity: 0;
                    transform: translateY(10px);
                    animation: textFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
                }

                @keyframes stroke {
                    100% { stroke-dashoffset: 0; }
                }

                @keyframes textFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Standard Modal Animations */
                .booking-backdrop {
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .booking-backdrop-open {
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    opacity: 1;
                    pointer-events: auto;
                }
                .booking-backdrop-closed {
                    background: rgba(0, 0, 0, 0);
                    backdrop-filter: blur(0px);
                    -webkit-backdrop-filter: blur(0px);
                    opacity: 0;
                    pointer-events: none;
                }

                /* Modal - Futuristic Entrance */
                .booking-modal {
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 
                        0 20px 40px -10px rgba(0,0,0,0.5),
                        0 0 0 1px rgba(255,255,255,0.05);
                }
                .booking-modal-open {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                .booking-modal-closed {
                    transform: translateY(40px) scale(0.92);
                    opacity: 0;
                }

                /* Day Pills */
                .day-pill {
                    position: relative;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                }
                .day-pill-selected {
                    background: linear-gradient(180deg, #ffffff 0%, #e5e5e7 100%) !important;
                    border-color: rgba(255, 255, 255, 0.3) !important;
                    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                    border-radius: 12px;
                }
                
                .animate-pop-in {
                    animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-slide-in {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateX(20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }

                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div >
    );
};