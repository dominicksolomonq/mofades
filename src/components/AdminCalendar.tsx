import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';

interface AdminCalendarProps {
    appointments: Appointment[];
}

type ViewMode = 'day' | 'week' | 'month';

interface CalendarAppointment extends Appointment {
    durationMinutes?: number;
    serviceName?: string;
    customerPhone?: string;
    note?: string;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({ appointments }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);

    // Get booked appointments only
    const bookedAppointments = useMemo(() => {
        return appointments.filter(a => a.status === 'booked') as CalendarAppointment[];
    }, [appointments]);

    // Navigation handlers
    const goToToday = () => setCurrentDate(new Date());

    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    // Get week dates
    const getWeekDates = () => {
        const dates = [];
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // Get month dates
    const getMonthDates = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const dates = [];

        // Add padding for days before first of month
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startPadding; i > 0; i--) {
            const date = new Date(year, month, 1 - i);
            dates.push({ date, isCurrentMonth: false });
        }

        // Add days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            dates.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Add padding for days after last of month
        const remaining = 42 - dates.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            dates.push({ date, isCurrentMonth: false });
        }

        return dates;
    };

    const formatDateStr = (date: Date) => date.toISOString().split('T')[0];

    const getAppointmentsForDate = (date: Date) => {
        const dateStr = formatDateStr(date);
        return bookedAppointments.filter(a => a.date === dateStr);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return formatDateStr(date) === formatDateStr(today);
    };

    const formatTime = (time: string) => {
        return time.padStart(5, '0').replace(':00', ':00');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'booked': return 'bg-white/10 border-white/20';
            case 'confirmed': return 'bg-emerald-500/20 border-emerald-500/30';
            case 'canceled': return 'bg-red-500/20 border-red-500/30';
            default: return 'bg-white/10 border-white/20';
        }
    };

    const weekDates = getWeekDates();
    const monthDates = getMonthDates();

    // Time slots for week/day view (13:00 - 20:00)
    const timeSlots = Array.from({ length: 8 }, (_, i) => `${13 + i}:00`);

    return (
        <div className="flex flex-col h-full">
            {/* Calendar Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 flex-shrink-0">
                {/* Title & Date */}
                <div className="flex items-center gap-3">
                    <h2 className="text-white text-xl md:text-2xl font-semibold">
                        {viewMode === 'month'
                            ? currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
                            : viewMode === 'week'
                                ? `KW ${getWeekNumber(currentDate)}`
                                : currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
                        }
                    </h2>
                </div>

                {/* Navigation & View Switch */}
                <div className="flex items-center gap-2">
                    {/* Today Button */}
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                        Heute
                    </button>

                    {/* Prev/Next */}
                    <div className="flex items-center bg-white/5 rounded-lg">
                        <button
                            onClick={goToPrevious}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-l-lg transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-r-lg transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* View Mode Switch */}
                    <div className="flex bg-white/5 rounded-lg p-0.5">
                        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === mode
                                    ? 'bg-white text-black'
                                    : 'text-white/70 hover:text-white'
                                    }`}
                            >
                                {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 min-h-0 overflow-auto calendar-scrollbar">
                {viewMode === 'month' && (
                    <MonthView
                        monthDates={monthDates}
                        getAppointmentsForDate={getAppointmentsForDate}
                        isToday={isToday}
                        onSelectAppointment={setSelectedAppointment}
                        getStatusColor={getStatusColor}
                    />
                )}

                {viewMode === 'week' && (
                    <WeekView
                        weekDates={weekDates}
                        timeSlots={timeSlots}
                        getAppointmentsForDate={getAppointmentsForDate}
                        isToday={isToday}
                        onSelectAppointment={setSelectedAppointment}
                        formatTime={formatTime}
                        getStatusColor={getStatusColor}
                    />
                )}

                {viewMode === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        timeSlots={timeSlots}
                        getAppointmentsForDate={getAppointmentsForDate}
                        onSelectAppointment={setSelectedAppointment}
                        formatTime={formatTime}
                        getStatusColor={getStatusColor}
                    />
                )}
            </div>

            {/* Appointment Details Drawer */}
            {selectedAppointment && (
                <AppointmentDrawer
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}

            <style>{`
                .calendar-scrollbar::-webkit-scrollbar,
                .calendar-scrollbar *::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .calendar-scrollbar::-webkit-scrollbar-track,
                .calendar-scrollbar *::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .calendar-scrollbar::-webkit-scrollbar-thumb,
                .calendar-scrollbar *::-webkit-scrollbar-thumb {
                    background: #1c1c1c;
                    border-radius: 4px;
                    border: 2px solid #0a0a0a;
                }
                .calendar-scrollbar::-webkit-scrollbar-thumb:hover,
                .calendar-scrollbar *::-webkit-scrollbar-thumb:hover {
                    background: #2c2c2c;
                }
                .calendar-scrollbar::-webkit-scrollbar-corner,
                .calendar-scrollbar *::-webkit-scrollbar-corner {
                    background: #0a0a0a;
                }
            `}</style>
        </div>
    );
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Month View Component
const MonthView: React.FC<{
    monthDates: { date: Date; isCurrentMonth: boolean }[];
    getAppointmentsForDate: (date: Date) => CalendarAppointment[];
    isToday: (date: Date) => boolean;
    onSelectAppointment: (apt: CalendarAppointment) => void;
    getStatusColor: (status: string) => string;
}> = ({ monthDates, getAppointmentsForDate, isToday, onSelectAppointment, getStatusColor }) => {
    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
        <div className="h-full flex flex-col">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs text-white/40 font-medium py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
                {monthDates.map(({ date, isCurrentMonth }, idx) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const today = isToday(date);

                    return (
                        <div
                            key={idx}
                            className={`
                                min-h-[80px] md:min-h-[100px] p-1 rounded-lg border transition-all
                                ${isCurrentMonth ? 'bg-white/[0.02] border-white/5' : 'bg-transparent border-transparent'}
                                ${today ? 'ring-1 ring-white/20' : ''}
                            `}
                        >
                            <div className={`text-xs font-medium mb-1 ${isCurrentMonth ? 'text-white/70' : 'text-white/20'} ${today ? 'text-white' : ''}`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                {dayAppointments.slice(0, 3).map(apt => (
                                    <button
                                        key={apt.id}
                                        onClick={() => onSelectAppointment(apt)}
                                        className={`
                                            w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate
                                            border ${getStatusColor(apt.status)}
                                            hover:bg-white/20 transition-all
                                        `}
                                    >
                                        <span className="text-white/60">{apt.time}</span>
                                        <span className="text-white ml-1">{apt.customerName?.split(' ')[0]}</span>
                                    </button>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[10px] text-white/40 px-1">
                                        +{dayAppointments.length - 3} mehr
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Week View Component
const WeekView: React.FC<{
    weekDates: Date[];
    timeSlots: string[];
    getAppointmentsForDate: (date: Date) => CalendarAppointment[];
    isToday: (date: Date) => boolean;
    onSelectAppointment: (apt: CalendarAppointment) => void;
    formatTime: (time: string) => string;
    getStatusColor: (status: string) => string;
}> = ({ weekDates, timeSlots, getAppointmentsForDate, isToday, onSelectAppointment, formatTime, getStatusColor }) => {
    return (
        <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-2 sticky top-0 bg-[#0a0a0a] z-10 pb-2">
                <div className="w-12"></div>
                {weekDates.map((date, idx) => {
                    const today = isToday(date);
                    return (
                        <div key={idx} className={`text-center ${today ? 'text-white' : 'text-white/50'}`}>
                            <div className="text-[10px] uppercase font-medium">
                                {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                            </div>
                            <div className={`text-lg font-semibold ${today ? 'bg-white text-black rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className="flex-1 overflow-auto calendar-scrollbar">
                {timeSlots.map(time => (
                    <div key={time} className="grid grid-cols-8 gap-1 min-h-[60px] border-t border-white/5">
                        <div className="w-12 text-[10px] text-white/40 pt-1 text-right pr-2">
                            {time}
                        </div>
                        {weekDates.map((date, idx) => {
                            const dayAppointments = getAppointmentsForDate(date);
                            const timeAppointments = dayAppointments.filter(a => a.time === time);

                            return (
                                <div key={idx} className="relative p-0.5">
                                    {timeAppointments.map(apt => (
                                        <button
                                            key={apt.id}
                                            onClick={() => onSelectAppointment(apt)}
                                            className={`
                                                w-full text-left p-1.5 rounded-md text-xs
                                                border ${getStatusColor(apt.status)}
                                                hover:bg-white/20 transition-all
                                            `}
                                        >
                                            <div className="text-white font-medium truncate">{apt.customerName}</div>
                                            <div className="text-white/50 text-[10px]">{apt.time}</div>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Day View Component
const DayView: React.FC<{
    currentDate: Date;
    timeSlots: string[];
    getAppointmentsForDate: (date: Date) => CalendarAppointment[];
    onSelectAppointment: (apt: CalendarAppointment) => void;
    formatTime: (time: string) => string;
    getStatusColor: (status: string) => string;
}> = ({ currentDate, timeSlots, getAppointmentsForDate, onSelectAppointment, formatTime, getStatusColor }) => {
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
        <div className="space-y-1">
            {timeSlots.map(time => {
                const timeAppointments = dayAppointments.filter(a => a.time === time);

                return (
                    <div key={time} className="flex gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-all">
                        <div className="w-16 text-sm text-white/40 font-medium pt-1">
                            {time}
                        </div>
                        <div className="flex-1">
                            {timeAppointments.length > 0 ? (
                                timeAppointments.map(apt => (
                                    <button
                                        key={apt.id}
                                        onClick={() => onSelectAppointment(apt)}
                                        className={`
                                            w-full text-left p-3 rounded-xl
                                            border ${getStatusColor(apt.status)}
                                            hover:bg-white/10 transition-all
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-white font-medium">{apt.customerName}</div>
                                            <div className="text-white/50 text-sm">{apt.time}</div>
                                        </div>
                                        {apt.customerEmail && (
                                            <div className="text-white/40 text-sm mt-1">{apt.customerEmail}</div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="h-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                    Keine Buchung
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Appointment Details Drawer
const AppointmentDrawer: React.FC<{
    appointment: CalendarAppointment;
    onClose: () => void;
}> = ({ appointment, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full bg-[#1c1c1e] rounded-t-2xl md:rounded-2xl z-[70] animate-slide-up">
                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-3 md:hidden">
                    <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold text-lg">Termindetails</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${appointment.status === 'booked' ? 'bg-white/10 text-white' : ''}
                            ${appointment.status === 'blocked' ? 'bg-red-500/20 text-red-400' : ''}
                            ${appointment.status === 'free' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                        `}>
                            {appointment.status === 'booked' ? 'Gebucht' : appointment.status === 'blocked' ? 'Blockiert' : 'Frei'}
                        </span>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-white font-medium">{appointment.customerName || 'Unbekannt'}</div>
                                <div className="text-white/40 text-sm">Kunde</div>
                            </div>
                        </div>

                        {appointment.customerEmail && (
                            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                                <span className="text-white/70 text-sm">{appointment.customerEmail}</span>
                            </div>
                        )}

                        {appointment.customerPhone && (
                            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                                <span className="text-white/70 text-sm">{appointment.customerPhone}</span>
                            </div>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <div>
                                <div className="text-white font-medium">
                                    {new Date(appointment.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                <div className="text-white/40 text-sm">{appointment.time} Uhr</div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {appointment.note && (
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-white/40 text-xs uppercase mb-2">Notizen</div>
                            <div className="text-white/70 text-sm">{appointment.note}</div>
                        </div>
                    )}
                </div>

                {/* Footer padding for safe area */}
                <div className="h-6 md:h-4"></div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media (min-width: 768px) {
                    .animate-slide-up {
                        animation: none;
                    }
                }
            `}</style>
        </>
    );
};

interface CalendarAppointment extends Appointment { }
