import { useState, useEffect } from 'react';
import { X, Upload, Music, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { uploadAudioToCloudinary } from '../../lib/cloudinary';
import { db } from '../../lib/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { animate } from 'animejs';

interface UploadAudioModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function UploadAudioModal({ onClose, onSuccess }: UploadAudioModalProps) {
    const { user, profile } = useAuthStore();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Core Dev');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ['Core Dev', 'Chill', 'Web3', 'Tutorial', 'Lo-Fi', 'Insights'];

    useEffect(() => {
        // Entrance animation
        animate('.modal-box', {
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutCubic'
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('audio/')) {
                setError('Lütfen geçerli bir ses dosyası seçin (.mp3, .wav, .m4a)');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!user || !profile || !file || !title) {
            setError('Please complete all fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Upload audio to Cloudinary
            const audioUrl = await uploadAudioToCloudinary(file);

            // Mock duration as we don't have the explicit length yet without loading it first.
            // A more solid implementation would read metadata.
            const duration = '3:00'; 

            await addDoc(collection(db, 'voice_nodes'), {
                title: title.trim(),
                audioUrl,
                category,
                userId: user.uid,
                uploaderName: profile.username || 'User',
                uploaderAvatar: profile.avatar_url || '',
                duration,
                createdAt: serverTimestamp()
            });

            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Yükleme sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="modal-box w-full max-w-lg bg-[#0f0f0f] border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                        Upload Audio Node
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Node Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Audio title..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors outline-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-[#0f0f0f]">{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audio File</label>
                        <label className={cn(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                            file ? "border-green-500/50 bg-green-500/5" : "border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5"
                        )}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <Music className="w-8 h-8 text-green-500 mb-2" />
                                        <p className="text-sm text-green-400 font-medium">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                        <p className="text-sm text-gray-400">Click to select audio file</p>
                                        <p className="text-xs text-gray-500 mt-1">.mp3, .wav, .m4a</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white/5 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={loading || !file || !title}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all font-bold px-8 border-none text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                                Uploading...
                            </>
                        ) : 'Upload Node'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
