import React, { useState, useEffect } from 'react';

export const IOSInstallPrompt: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Detect if running on iOS (iPhone/iPad)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // Detect if running in standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

        // Ensure we haven't dismissed it recently (showing it once per session for now)
        const hasDismissed = sessionStorage.getItem('ios-install-dismissed');

        if (isIOS && !isStandalone && !hasDismissed) {
            // Delay showing it slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('ios-install-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none pb-6 px-4 animate-fade-in-up">
            {/* Backdrop check - only if we want to block interaction, but usually better not to. 
                Using pointer-events-none for container, auto for content. */}
            <div className="bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-sm pointer-events-auto relative">

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-white/30 hover:text-white p-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-start gap-4 mb-4">
                    <img src="/real logo website.png" alt="App Icon" className="w-14 h-14 rounded-xl shadow-lg bg-black object-cover" />
                    <div>
                        <h3 className="text-white font-semibold text-lg">MO FADES installieren</h3>
                        <p className="text-white/60 text-xs mt-1 leading-relaxed">
                            Füge die App zu deinem Home-Screen hinzu für das beste Erlebnis.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                        <div className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-full">1</div>
                        <span>Tippe unten auf <span className="font-bold text-blue-400">Teilen</span> <i className="fas fa-share-from-square mx-1"></i></span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                        <div className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-full">2</div>
                        <span>Wähle <span className="font-bold">"Zum Home-Bildschirm"</span></span>
                    </div>
                </div>

                {/* Arrow pointing down to the browser share button (Safari usually center bottom) */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1C1C1E]/95 backdrop-blur-xl border-r border-b border-white/10 rotate-45 transform"></div>
            </div>
        </div>
    );
};
