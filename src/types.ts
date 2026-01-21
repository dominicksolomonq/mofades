import React from 'react';

export interface GalleryItem {
    id: number;
    url: string;
}

export interface Appointment {
    id: string;
    date: string; // Format YYYY-MM-DD
    time: string;
    status: 'free' | 'booked' | 'blocked';
    customerName?: string;
    customerEmail?: string;
}

export interface UIProps {
    onOpenGallery: () => void;
    onOpenBooking: () => void;
    onOpenAdmin: () => void;
    modelLoaded: boolean;
}

export interface GalleryProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface BookingProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: Appointment[];
    onBookSlot: (id: string, name: string, email: string) => void;
}

export interface AdminProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: Appointment[];
    onToggleSlot: (id: string) => void;
}

export interface ModelProps {
    url: string | null;
    onError: () => void;
    onLoad: () => void;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}