import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, GalleryProps, Review } from '../types';

export const GalleryOverlay: React.FC<GalleryProps> = ({ isOpen, onClose }) => {
    // View State: 'gallery' or 'reviews'
    const [view, setView] = useState<'gallery' | 'reviews'>('gallery');

    // Gallery Data
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);

    // Review Data
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Upload State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Review Form State
    const [reviewName, setReviewName] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [reviewStars, setReviewStars] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    // Check LocalStorage on mount - DISABLED FOR TESTING
    useEffect(() => {
        // const reviewed = localStorage.getItem('mo_styles_reviewed');
        // if (reviewed) setHasReviewed(true);
    }, []);

    const fetchGallery = async () => {
        setLoadingGallery(true);
        try {
            const res = await fetch('/api/gallery');
            if (res.ok) setItems(await res.json());
        } catch (err) {
            console.error('Failed to load gallery', err);
        } finally {
            setLoadingGallery(false);
        }
    };

    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            const res = await fetch('/api/reviews');
            if (res.ok) setReviews(await res.json());
        } catch (err) {
            console.error('Failed to load reviews', err);
        } finally {
            setLoadingReviews(false);
        }
    };

    // Fetch Data when opening or switching tabs
    useEffect(() => {
        if (isOpen) {
            if (view === 'gallery') fetchGallery();
            else fetchReviews();
        }
    }, [isOpen, view]);

    const playSendSound = () => {
        try {
            // Using success.mp3 as placeholder for message send sound
            const audio = new Audio('/WhatsApp-Sending-Message-Sound-Effect.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Audio play failed', e));
        } catch (e) { console.error(e); }
    };

    // --- Image Compression Helper ---
    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Max dimensions - keep reasonable for mobile/web
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // --- Gallery Handlers ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];

            // Try to compress
            try {
                // Show some loading state or just wait momentarily? 
                // Alternatively, set preview immediately then swap file.
                // For simplicity, await compression here.
                if (file.size > 500000) { // Only compress if > 500KB
                    file = await compressImage(file);
                }
            } catch (err) {
                console.warn('Image compression failed, using original', err);
            }

            setUploadFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setUploadPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', uploadFile);
        formData.append('username', uploadName || 'User');
        try {
            const res = await fetch('/api/gallery/upload', { method: 'POST', body: formData });
            if (res.ok) {
                setUploadFile(null); setUploadPreview(null); setUploadName(''); setShowUpload(false);
                alert('Bild erfolgreich hochgeladen! Es wird nach einer kurzen Prüfung freigeschaltet.');
            } else alert('Upload fehlgeschlagen.');
        } catch (err) { alert('Fehler beim Upload.'); } finally { setIsUploading(false); }
    };

    // --- Review Handlers ---
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        // REMOVED hasReviewed check for testing
        if (!reviewName.trim()) return;

        setIsSubmittingReview(true);
        playSendSound(); // Play sound immediately for responsiveness

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: reviewName, stars: reviewStars, text: reviewText })
            });
            const data = await res.json();
            if (res.ok) {
                setReviewName(''); setReviewText(''); setReviewStars(5);
                // setHasReviewed(true); // DISABLED for testing
                // localStorage.setItem('mo_styles_reviewed', 'true'); // DISABLED for testing
                fetchReviews(); // Refresh list
            } else {
                alert(data.error || 'Fehler beim Senden.');
            }
        } catch (err) { alert('Fehler beim Senden.'); } finally { setIsSubmittingReview(false); }
    };

    // Helper for Random Icons
    const getIconForUser = (username: string) => {
        const icons = ['bolt', 'star', 'moon', 'fire', 'heart', 'crown', 'gem', 'leaf', 'snowflake', 'sun'];
        const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return icons[hash % icons.length];
    };

    // --- Helpers ---
    const Avatar = ({ username, color }: { username: string, color?: string }) => {
        const initials = (username || 'User').slice(0, 2).toUpperCase();
        // Modern Barber colors (Dark aesthetic)
        const bgColor = color || 'bg-zinc-700';
        return (
            <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10 shrink-0`}>
                {initials}
            </div>
        );
    };

    const StarRating = ({ stars }: { stars: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <i key={i} className={`fas fa-star text-[10px] ${i <= stars ? 'text-white' : 'text-zinc-700'}`}></i>
            ))}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>

            <div className={`
                relative w-full max-w-5xl h-full md:h-[90vh] bg-[#121212]/95 backdrop-blur-2xl 
                rounded-none md:rounded-3xl shadow-2xl border-0 md:border border-white/5 flex flex-col overflow-hidden
                transform transition-all duration-500 ease-out animate-slide-up
            `}>
                <style>{`
                    .gallery-grid-img { 
                        filter: grayscale(100%) !important; 
                        -webkit-filter: grayscale(100%) !important;
                        transition: all 0.5s ease; 
                    }
                    .gallery-item:hover .gallery-grid-img { 
                        filter: grayscale(0%) !important; 
                         -webkit-filter: grayscale(0%) !important;
                    }
                    .gallery-item .overlay { opacity: 0 !important; transition: opacity 0.3s ease; }
                    .gallery-item:hover .overlay { opacity: 1 !important; }
                `}</style>
                {/* Header with Tabs */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setView('gallery')}
                            className={`text-lg md:text-xl font-bold transition-colors ${view === 'gallery' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Community Galerie
                        </button>
                        <button
                            onClick={() => setView('reviews')}
                            className={`text-lg md:text-xl font-bold transition-colors ${view === 'reviews' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Bewertungen
                            {/* New Badge */}
                            <span className="ml-2 px-1.5 py-0.5 bg-white text-black text-[9px] rounded font-bold align-middle">NEU</span>
                        </button>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {/* --- GALLERY VIEW --- */}
                    {view === 'gallery' && (
                        <>
                            {loadingGallery ? (
                                <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">Lade Bilder...</div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                                    <i className="far fa-images text-5xl mb-4"></i>
                                    <p>Noch keine Bilder vorhanden.</p>
                                </div>
                            ) : (
                                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                                    {items.map((item, index) => { // Added index
                                        const imgIndex = (index % 12) + 1;
                                        return (
                                            <div key={item.id} className="gallery-item relative break-inside-avoid rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                                <img
                                                    src={item.imageUrl}
                                                    alt="Haircut"
                                                    className="w-full h-auto object-cover block gallery-grid-img"
                                                    loading="lazy"
                                                />
                                                {/* Overlay with Avatar */}
                                                <div className="overlay absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center gap-2">
                                                    {/* Use Image Avatar */}
                                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-black border border-white/10">
                                                        <img
                                                            src={`/img${imgIndex}.jpeg`}
                                                            alt={item.username}
                                                            className="w-full h-full object-cover mix-blend-screen"
                                                        />
                                                    </div>
                                                    <span className="text-white text-xs font-medium truncate drop-shadow-md opacity-90">
                                                        {item.username}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Gallery Upload Button */}
                            <div className="absolute bottom-6 right-6">
                                <button onClick={() => setShowUpload(true)} className="w-14 h-14 rounded-full bg-gradient-to-tr from-white to-zinc-300 text-black shadow-lg shadow-white/20 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all duration-300 group z-10">
                                    <i className="fas fa-camera"></i>
                                </button>
                            </div>
                        </>
                    )}

                    {/* --- REVIEWS VIEW --- */}
                    {view === 'reviews' && (
                        <div className="max-w-2xl mx-auto pb-10 flex flex-col h-full">

                            {/* Reviews List (Scrollable Area) */}
                            <div className="flex-1 space-y-6 overflow-y-auto px-2 pt-4 pb-24 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`
                                    .no-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                {loadingReviews ? (
                                    <div className="text-center text-zinc-500 py-10 animate-pulse">Lade Nachrichten...</div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center text-zinc-600 py-10">Keine Bewertungen bisher.</div>
                                ) : (
                                    reviews.map((review, index) => {
                                        const imgIndex = (index % 12) + 1;
                                        return (
                                            <div key={review.id} className="flex gap-3 items-end animate-fade-in-up">
                                                {/* Avatar - Image */}
                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-1 bg-black">
                                                    <img
                                                        src={`/img${imgIndex}.jpeg`}
                                                        alt={review.username}
                                                        className="w-full h-full object-cover mix-blend-screen"
                                                    />
                                                </div>

                                                {/* iMessage Bubble */}
                                                <div className="flex flex-col max-w-[80%]">
                                                    <span className="text-[10px] text-zinc-500 ml-3 mb-1 flex items-center gap-2">
                                                        {review.username}
                                                        <span className="text-yellow-500 text-[9px]"><i className="fas fa-star mr-0.5"></i>{review.stars}</span>
                                                    </span>
                                                    <div className="px-4 py-2.5 bg-[#2C2C2E] rounded-2xl rounded-bl-sm text-white text-sm shadow-sm border border-white/5 relative">
                                                        {review.text || <em className="opacity-50">Kein Text</em>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Sticky Input Area (iMessage Style) */}
                            <div className="mt-4 pt-4 border-t border-white/10 bg-[#121212]/50 backdrop-blur-md sticky bottom-0">
                                {/* hasReviewed restriction removed for testing */}
                                <form onSubmit={handleSubmitReview} className="flex gap-2 items-end">
                                    <div className="flex-1 bg-[#1C1C1E] rounded-3xl border border-white/10 p-1 pl-4 flex items-center gap-2 focus-within:border-white/30 transition-colors">

                                        {/* Stars Input */}
                                        <div className="flex gap-0.5 mr-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewStars(star)}
                                                    className={`transition-transform hover:scale-110 ${reviewStars >= star ? 'text-yellow-400' : 'text-zinc-700'}`}
                                                >
                                                    <i className="fas fa-star text-[10px]"></i>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Inputs Container */}
                                        <div className="flex-1 flex flex-col justify-center py-1">
                                            <input
                                                type="text"
                                                required
                                                value={reviewName}
                                                onChange={e => setReviewName(e.target.value)}
                                                placeholder="Name"
                                                className="bg-transparent text-white text-base font-bold focus:outline-none placeholder-zinc-600 mb-0.5 w-[80px]"
                                            />
                                            <input
                                                type="text"
                                                maxLength={50}
                                                value={reviewText}
                                                onChange={e => setReviewText(e.target.value)}
                                                placeholder="Schreibe eine Bewertung..."
                                                className="bg-transparent text-white text-base focus:outline-none placeholder-zinc-500 w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview || !reviewName.trim() || !reviewText.trim()}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 mb-1
                                            ${(reviewName.trim() && reviewText.trim()) ? 'bg-blue-500 text-white hover:scale-105 active:scale-95' : 'bg-zinc-800 text-zinc-600'}
                                        `}
                                    >
                                        <i className="fas fa-arrow-up text-sm font-bold"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-3 left-6 pointer-events-none z-20">
                    <span className="text-[9px] text-zinc-700 italic opacity-50">made by domi</span>
                </div>
            </div>

            {/* Gallery Upload Modal (retained) */}
            {showUpload && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpload(false)}></div>
                    <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl p-5 animate-slide-up">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Neuer Beitrag</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div onClick={() => fileInputRef.current?.click()} className={`w-full h-48 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 ${uploadPreview ? 'border-none' : ''}`}>
                                {uploadPreview ? <img src={uploadPreview} className="w-full h-full object-cover rounded-xl" /> : <><i className="fas fa-camera text-3xl text-zinc-500 mb-2"></i><p className="text-zinc-400 text-sm">Foto wählen</p></>}
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                            </div>
                            <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Dein Name" className="w-full bg-[#27272a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm" />
                            <div className="flex gap-2"><button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2 bg-zinc-800 text-white rounded-lg text-sm">Abbrechen</button><button type="submit" disabled={!uploadFile} className="flex-1 py-2 bg-white text-black rounded-lg text-sm font-bold">Hochladen</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
