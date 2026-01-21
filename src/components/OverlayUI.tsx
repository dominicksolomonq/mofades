import React from 'react';
import { UIProps } from '../types';

export const OverlayUI: React.FC<UIProps> = ({ onOpenGallery, onOpenBooking, onOpenAdmin, modelLoaded }) => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none text-white font-sans">
        {/* Instagram Button */}
        <a 
            href="instagram.com" 
            className="absolute top-6 left-6 md:top-8 md:left-8 w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:border-white hover:scale-105 pointer-events-auto"
        >
            <i className="fab fa-instagram"></i>
        </a>

        {/* Admin Button (Top Right) */}
        <button 
            onClick={onOpenAdmin}
            className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white transition-colors pointer-events-auto"
            title="Admin Login"
        >
            <i className="fas fa-lock text-sm"></i>
        </button>

        {/* Bottom Navigation */}
        <div className="absolute bottom-12 md:bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col md:flex-row gap-5 md:gap-10 pointer-events-auto w-full items-center justify-center">
            <button 
                onClick={onOpenBooking}
                className="bg-transparent border-none text-white text-sm tracking-[2px] uppercase opacity-70 hover:opacity-100 transition-opacity relative py-2 group cursor-pointer"
            >
                <span className="opacity-50 mr-2">00</span> Termin buchen
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
                onClick={onOpenGallery}
                className="bg-transparent border-none text-white text-sm tracking-[2px] uppercase opacity-70 hover:opacity-100 transition-opacity relative py-2 group cursor-pointer"
            >
                <span className="opacity-50 mr-2">01</span> Galerie
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full"></span>
            </button>
        </div>
    </div>
  );
};