import React from 'react';

export interface GalleryItem {
    id: string; // Changed to string to match backend
    imageUrl: string; // Changed from url
    username: string; // For avatar generation
    status: 'pending' | 'approved';
    timestamp?: string; // Optional, date string from JSON
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

export interface Review {
    id: string;
    username: string;
    stars: number;
    text: string;
    avatarColor: string; // Store color to be consistent or just rely on hash later
    timestamp: string;
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