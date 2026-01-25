import React from 'react';
import { UIProps } from '../types';
import { IOSInstallPrompt } from './IOSInstallPrompt';

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

            {/* Bottom Navigation - Glassmorphism Upgrade */}
            <div className="absolute bottom-8 md:bottom-12 lg:bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col md:flex-row gap-4 md:gap-8 pointer-events-auto w-full max-w-xs md:max-w-none items-center justify-center px-6">

                {/* Book Button */}
                <button
                    onClick={onOpenBooking}
                    className="relative w-full md:w-auto overflow-hidden group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <span className="text-white/40 font-mono text-xs border-r border-white/20 pr-3">01</span>
                        <span className="text-white text-sm md:text-base tracking-[3px] uppercase font-light group-hover:text-white transition-colors duration-300">Termin</span>
                    </div>
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                </button>

                {/* Gallery Button */}
                <button
                    onClick={onOpenGallery}
                    className="relative w-full md:w-auto overflow-hidden group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/30 px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <span className="text-white/40 font-mono text-xs border-r border-white/20 pr-3">02</span>
                        <span className="text-white text-sm md:text-base tracking-[3px] uppercase font-light group-hover:text-white transition-colors duration-300">Galerie</span>
                    </div>
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                </button>

            </div>
            {/* IOS Install Prompt */}
            <IOSInstallPrompt />
        </div>
    );
};