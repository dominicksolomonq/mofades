import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, GalleryProps } from '../types';

export const GalleryOverlay: React.FC<GalleryProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Upload State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [uploadName, setUploadName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch items when opening
    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/gallery');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Failed to load gallery', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', uploadFile);
        formData.append('username', uploadName || 'User'); // Use fallback

        try {
            const res = await fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // Reset form
                setUploadFile(null);
                setUploadPreview(null);
                setUploadName('');
                setShowUpload(false);
                alert('Bild erfolgreich hochgeladen! Es wird nach einer kurzen Prüfung freigeschaltet.');
                // We don't verify fetchItems immediately because pending items aren't shown
            } else {
                alert('Upload fehlgeschlagen.');
            }
        } catch (err) {
            console.error('Upload error', err);
            alert('Fehler beim Upload.');
        } finally {
            setIsUploading(false);
        }
    };

    // Helper for Avatar
    const Avatar = ({ username }: { username: string }) => {
        const initials = (username || 'User').slice(0, 2).toUpperCase();
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
        const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[hash % colors.length];

        return (
            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white/10 shrink-0`}>
                {initials}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Main Modal Container */}
            <div className={`
                relative w-full max-w-5xl h-[85vh] md:h-[90vh] bg-[#121212]/90 backdrop-blur-xl 
                rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden
                transform transition-all duration-500 ease-out
                animate-slide-up
            `}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Community Galerie
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all backdrop-blur-sm"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Content Area - Masonry Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
                            Lade Galerie...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                            <i className="far fa-images text-5xl mb-4"></i>
                            <p>Noch keine Bilder vorhanden.</p>
                            <p className="text-sm mt-2">Sei der Erste!</p>
                        </div>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="relative group break-inside-avoid rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                                    {/* Image with Fade In */}
                                    <img
                                        src={item.imageUrl}
                                        alt="Haircut"
                                        className="w-full h-auto object-cover block animate-fade-in filter grayscale transition-all duration-500 group-hover:grayscale-0"
                                        loading="lazy"
                                    />

                                    {/* Overlay with Avatar (Always visible on mobile, hover on desktop?) -> Let's make it subtle gradient bottom */}
                                    <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center gap-2 opacity-100 transition-opacity">
                                        <Avatar username={item.username} />
                                        <span className="text-white text-xs font-medium truncate drop-shadow-md opacity-90">
                                            {item.username}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="absolute bottom-6 right-6">
                    <button
                        onClick={() => setShowUpload(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-white to-zinc-300 text-black shadow-lg shadow-white/20 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all duration-300 group z-10"
                        title="Bild hochladen"
                    >
                        <i className="fas fa-camera"></i>
                        {/* Ping Animation */}
                        <span className="absolute -inset-1 rounded-full bg-white opacity-20 group-hover:animate-ping"></span>
                    </button>
                </div>

                <div className="absolute bottom-3 left-6 pointer-events-none">
                    <span className="text-[10px] text-zinc-700 italic opacity-50">made by domi</span>
                </div>
            </div>

            {/* Upload Modal (Overlay on top) */}
            {showUpload && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowUpload(false)}
                    ></div>

                    <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] animate-slide-up transform">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Neuer Beitrag</h3>

                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* Image Preview / Selection - Compact Height */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    w-full h-48 rounded-xl border-2 border-dashed border-white/20
                                    flex flex-col items-center justify-center cursor-pointer
                                    hover:bg-white/5 hover:border-white/40 transition-all group overflow-hidden relative
                                    ${uploadPreview ? 'border-none' : ''}
                                `}
                            >
                                {uploadPreview ? (
                                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <>
                                        <i className="fas fa-cloud-upload-alt text-3xl text-zinc-500 mb-2 group-hover:text-white transition-colors"></i>
                                        <p className="text-zinc-400 text-sm">Foto auswählen</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* Name Input */}
                            <div>
                                <input
                                    type="text"
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    placeholder="Dein Name"
                                    className="w-full bg-[#27272a] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                    maxLength={20}
                                />
                            </div>

                            {/* Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" required className="mt-1 accent-white bg-zinc-800 border-zinc-600 rounded cursor-pointer" />
                                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                                    Ich besitze die Bildrechte & stimme der Veröffentlichung zu.
                                </span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(false)}
                                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors text-sm"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={!uploadFile || isUploading}
                                    className={`
                                        flex-1 py-2.5 rounded-lg font-medium transition-all text-sm
                                        ${!uploadFile || isUploading
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                            : 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/10'}
                                    `}
                                >
                                    {isUploading ? '...' : 'Hochladen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
