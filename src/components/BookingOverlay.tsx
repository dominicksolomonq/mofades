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
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();

                // Create a more authentic Apple Pay "ding-ding" sound
                // Two-tone pattern: First tone, then second higher tone
                const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
                    // Main oscillator - sine for purity
                    const osc1 = ctx.createOscillator();
                    const gain1 = ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(frequency, startTime);

                    // Secondary oscillator - slight detune for richness
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(frequency * 2, startTime); // Octave harmonic

                    // Percussive envelope - fast attack, medium decay
                    gain1.gain.setValueAtTime(0, startTime);
                    gain1.gain.linearRampToValueAtTime(volume, startTime + 0.008); // Super fast attack
                    gain1.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + 0.08); // Quick initial decay
                    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Smooth tail

                    // Harmonic envelope - softer
                    gain2.gain.setValueAtTime(0, startTime);
                    gain2.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.008);
                    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);

                    osc1.connect(gain1);
                    gain1.connect(ctx.destination);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);

                    osc1.start(startTime);
                    osc1.stop(startTime + duration + 0.1);
                    osc2.start(startTime);
                    osc2.stop(startTime + duration + 0.1);
                };

                // Apple Pay signature two-tone pattern
                // First tone: E7 (2637 Hz) - bright and clear
                // Second tone: G#7 (3322 Hz) - higher, creates the "success" feeling
                const now = ctx.currentTime;
                playTone(2637.02, now, 0.4, 0.12);           // First ding - E7
                playTone(3322.44, now + 0.12, 0.5, 0.10);    // Second ding - G#7 (major third up)

                // Subtle sub-harmonic for warmth
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(659.25, now); // E5 - two octaves below
                subGain.gain.setValueAtTime(0, now);
                subGain.gain.linearRampToValueAtTime(0.04, now + 0.01);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.4);
            }
        } catch (e) {
            console.error("Audio play failed", e);
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

            {/* Modal Container */}
            <div className={`relative w-full md:w-[450px] bg-[#0D0D0F] md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] booking-modal ${isOpen ? 'booking-modal-open' : 'booking-modal-closed'} ${showSuccess ? 'success-glow' : ''}`}>
                {/* Circling Border Shine Effect - Two orbs splitting from top center */}
                {showSuccess && (
                    <>
                        <div className="border-shine-left"></div>
                        <div className="border-shine-right"></div>
                    </>
                )}

                {/* Header */}
                <div className="flex justify-between items-center p-3 md:p-4 bg-[#2C2C2E]/50 border-b border-white/5">
                    <button onClick={onClose} className="text-white/70 hover:text-white text-base md:text-lg font-normal transition-colors duration-200">Abbrechen</button>
                    <h2 className="text-white font-semibold text-base md:text-lg">Termin</h2>
                    <div className="w-16"></div> {/* Spacer for center alignment */}
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 relative">

                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center h-64 animate-pop-in">
                            {/* Apple Pay Style Checkmark */}
                            <div className="w-24 h-24 rounded-full border-[3px] border-[#30D158] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(48,209,88,0.3)]">
                                <svg className="w-12 h-12 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="animate-[draw_0.6s_ease-in-out]" />
                                </svg>
                            </div>
                            <h3 className="text-white text-xl font-bold mb-1">Gebucht</h3>
                            <p className="text-zinc-400 text-sm">Bestätigung wurde gesendet.</p>
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

                                    <div className="mb-8">
                                        <p className="text-zinc-400 text-xs uppercase mb-2 ml-4">Ihre Daten</p>
                                        <div className="bg-[#2C2C2E] rounded-xl overflow-hidden">
                                            <div className="border-b border-[#3A3A3C]">
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                    className="w-full bg-transparent p-3 md:p-4 text-white placeholder-zinc-500 focus:outline-none text-sm md:text-base"
                                                    placeholder="Vollständiger Name"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="w-full bg-transparent p-3 md:p-4 text-white placeholder-zinc-500 focus:outline-none text-sm md:text-base"
                                                    placeholder="E-Mail Adresse"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSlot(null)}
                                            className="flex-1 bg-[#2C2C2E] text-white py-3 md:py-3.5 rounded-xl font-semibold active:scale-95 transition-transform text-sm md:text-base"
                                        >
                                            Zurück
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-b from-white to-[#e5e5e7] text-black py-3 md:py-3.5 rounded-xl font-semibold shadow-lg shadow-white/10 active:scale-95 transition-all duration-200 hover:shadow-white/20 text-sm md:text-base"
                                        >
                                            Buchen
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                /* Backdrop Animations */
                .booking-backdrop {
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .booking-backdrop-open {
                    background: rgba(0, 0, 0, 0.7);
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

                /* Modal Animations - Futuristic Entrance */
                .booking-modal {
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        0 25px 50px -12px rgba(0, 0, 0, 0.8),
                        0 0 100px rgba(255, 255, 255, 0.03);
                }
                .booking-modal-open {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                .booking-modal-closed {
                    transform: translateY(40px) scale(0.92);
                    opacity: 0;
                }

                /* Day Pills - Futuristic Style */
                .day-pill {
                    position: relative;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                }
                .day-pill::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .day-pill::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .day-pill-default:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.12);
                    transform: translateY(-1px) scale(1.02);
                }
                .day-pill-default:hover::before {
                    opacity: 0.5;
                }
                .day-pill-default:hover::after {
                    opacity: 1;
                }
                .day-pill-default:active {
                    transform: translateY(0) scale(0.98);
                }

                /* Selected Day - Clean White/Grey */
                /* Selected Day - Clean White/Grey */
                .day-pill-selected {
                    background: linear-gradient(180deg, #ffffff 0%, #e5e5e7 100%) !important;
                    border-color: rgba(255, 255, 255, 0.3) !important;
                    box-shadow: 
                        0 4px 15px rgba(255, 255, 255, 0.15),
                        0 0 30px rgba(255, 255, 255, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                    transform: translateY(-1px);
                    border-radius: 12px; /* Ensure rounding */
                }
                .day-pill-selected::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit; /* Crucial for round glow */
                    background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 40%);
                    opacity: 1;
                }

                /* Success Glow Effect on Modal */
                .success-glow {
                    box-shadow: 
                        0 0 0 1px rgba(255, 255, 255, 0.15),
                        0 0 80px rgba(255, 255, 255, 0.2),
                        0 0 120px rgba(255, 255, 255, 0.1),
                        0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
                }

                /* Dual Light Point - Small and Simple */
                .border-shine-left,
                .border-shine-right {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    pointer-events: none;
                    z-index: 100;
                    border-radius: 50%;
                    background: white;
                    box-shadow: 
                        0 0 4px rgba(255,255,255,1),
                        0 0 8px rgba(255,255,255,0.8),
                        0 0 16px rgba(255,255,255,0.5);
                }

                /* Left light - smooth continuous counterclockwise */
                .border-shine-left {
                    animation: shineLeft 3s linear forwards;
                }

                /* Right light - smooth continuous clockwise */
                .border-shine-right {
                    animation: shineRight 3s linear forwards;
                }

                @keyframes shineLeft {
                    0% {
                        top: 2px;
                        left: 50%;
                        opacity: 0;
                    }
                    3% {
                        opacity: 1;
                    }
                    /* Travel to top-left corner */
                    20% {
                        top: 2px;
                        left: 2px;
                    }
                    /* Travel down left side */
                    45% {
                        top: 50%;
                        left: 2px;
                    }
                    /* Continue to bottom-left corner */
                    65% {
                        top: calc(100% - 10px);
                        left: 2px;
                    }
                    /* Travel to bottom center */
                    90% {
                        top: calc(100% - 10px);
                        left: 50%;
                        opacity: 1;
                    }
                    100% {
                        top: calc(100% - 10px);
                        left: 50%;
                        opacity: 0;
                    }
                }

                @keyframes shineRight {
                    0% {
                        top: 2px;
                        left: 50%;
                        opacity: 0;
                    }
                    3% {
                        opacity: 1;
                    }
                    /* Travel to top-right corner */
                    20% {
                        top: 2px;
                        left: calc(100% - 10px);
                    }
                    /* Travel down right side */
                    45% {
                        top: 50%;
                        left: calc(100% - 10px);
                    }
                    /* Continue to bottom-right corner */
                    65% {
                        top: calc(100% - 10px);
                        left: calc(100% - 10px);
                    }
                    /* Travel to bottom center */
                    90% {
                        top: calc(100% - 10px);
                        left: 50%;
                        opacity: 1;
                    }
                    100% {
                        top: calc(100% - 10px);
                        left: 50%;
                        opacity: 0;
                    }
                }

                /* Flash effect when orbs meet at bottom */
                .success-glow::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
                    animation: bottomFlash 2.5s ease-out forwards;
                    opacity: 0;
                    z-index: 99;
                }

                @keyframes bottomFlash {
                    0%, 90% {
                        opacity: 0;
                        width: 0;
                    }
                    95% {
                        opacity: 1;
                        width: 200px;
                    }
                    100% {
                        opacity: 0;
                        width: 300px;
                    }
                }

                @keyframes draw {
                    0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; }
                    100% { stroke-dasharray: 100 0; stroke-dashoffset: 0; }
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateX(20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-pop-in {
                    animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-slide-in {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};