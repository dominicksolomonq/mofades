import React from 'react';
import { UIProps } from '../types';

export const OverlayUI: React.FC<UIProps> = ({ onOpenGallery, onOpenBooking, onOpenAdmin, modelLoaded }) => {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none select-none text-white font-sans">
            {/* Instagram Button - Responsive sizing for mobile/tablet/desktop */}
            <a
                href="https://www.instagram.com/moryramm?igsh=eGtwNXk4ZWR3azhk"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full border border-white/30 flex items-center justify-center text-base md:text-lg lg:text-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:border-white hover:scale-105 pointer-events-auto"
            >
                <i className="fab fa-instagram"></i>
            </a>

            {/* Admin Button (Top Right) - Responsive sizing */}
            <button
                onClick={onOpenAdmin}
                className="absolute top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center text-white/30 hover:text-white transition-colors pointer-events-auto"
                title="Admin Login"
            >
                <i className="fas fa-lock text-xs md:text-sm"></i>
            </button>

            {/* Bottom Navigation - Mobile optimized */}
            <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-10 pointer-events-auto w-full items-center justify-center px-4">
                <button
                    onClick={onOpenBooking}
                    className="bg-transparent border-none text-white text-xs md:text-sm tracking-[1.5px] md:tracking-[2px] uppercase opacity-70 hover:opacity-100 transition-opacity relative py-2 group cursor-pointer"
                >
                    <span className="opacity-50 mr-1.5 md:mr-2">00</span> Termin buchen
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full"></span>
                </button>
                <button
                    onClick={onOpenGallery}
                    className="bg-transparent border-none text-white text-xs md:text-sm tracking-[1.5px] md:tracking-[2px] uppercase opacity-70 hover:opacity-100 transition-opacity relative py-2 group cursor-pointer"
                >
                    <span className="opacity-50 mr-1.5 md:mr-2">01</span> Galerie
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full"></span>
                </button>
            </div>
        </div>
    );
};