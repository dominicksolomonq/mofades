import React from 'react';
import { GalleryProps } from '../types';

export const GalleryOverlay: React.FC<GalleryProps> = ({ isOpen, onClose }) => {
    const images = [
        "Bild 1.png",
        "Bild 2.png",
        "Bild 3.png",
        "Bild 4.png",
        "Bild 5.png",
        "Bild 6.png"
    ];

    return (
        <div
            className={`fixed inset-0 bg-[#050505]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-all duration-500 overflow-y-auto ${
                isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white text-3xl bg-transparent border-none cursor-pointer hover:text-zinc-300 transition-colors z-50 p-2"
            >
                &times;
            </button>

            <h2 className="text-white text-lg md:text-xl tracking-[3px] uppercase mb-6 font-light">
                Galerie
            </h2>

            {/* Smaller Grid */}
            <div
                className="grid grid-cols-2 md:grid-cols-3
                           gap-2                     /* smaller gap */
                           w-full
                           max-w-3xl                /* narrower grid */
                           px-2 md:px-0
                           scale-90 md:scale-95     /* compact overall */
                           transition-all duration-300"
            >
                {images.map((src, idx) => (
                    <div
                        key={idx}
                        className={`group overflow-hidden rounded-sm cursor-pointer relative aspect-square shadow-md ${
                            idx >= 4 ? 'hidden md:block' : 'block'
                        }`}
                    >
                        <img
                            src={src}
                            alt={`Galerie ${idx}`}
                            className="w-full h-full object-cover filter grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
