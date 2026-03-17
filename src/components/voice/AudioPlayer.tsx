import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, X, SkipBack, SkipForward } from 'lucide-react';
import { VoiceNote } from '../../types/voice';
import { cn } from '../../lib/utils';

interface AudioPlayerProps {
    currentTrack: VoiceNote;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export function AudioPlayer({ currentTrack, onClose, onNext, onPrev }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (currentTrack) {
            setIsPlaying(true);
            if (audioRef.current) {
                audioRef.current.play().catch(err => {
                    console.error("Audio playback error:", err);
                    setIsPlaying(false);
                });
            }
        }
    }, [currentTrack]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrentTime(current);
            setDuration(dur);
            if (dur > 0) {
                setProgress((current / dur) * 100);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = (parseFloat(e.target.value) / 100) * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime;
            setProgress(parseFloat(e.target.value));
        }
    };

    const handleEnded = () => {
        onNext(); // Auto play next track
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-purple-500/30 p-4 z-50 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(168,85,247,0.1)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
                {/* Track Info */}
                <div className="flex items-center gap-4 w-full md:w-1/4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        {currentTrack.uploaderAvatar ? (
                             <img src={currentTrack.uploaderAvatar} alt="" className="w-full h-full rounded-lg object-cover" />
                        ) : (
                             <div className="text-white font-bold">{currentTrack.uploaderName?.substring(0, 1).toUpperCase()}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{currentTrack.title}</h4>
                        <p className="text-gray-400 text-xs truncate">{currentTrack.uploaderName} • {currentTrack.category}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex-1 flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-6">
                        <button onClick={onPrev} className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                        </button>
                        <button onClick={onNext} className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full max-w-2xl text-[10px] text-gray-500 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <div className="flex-1 relative group h-4 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress || 0}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 relative z-10"
                            />
                            {/* Track bar fill */}
                            <div
                                className="absolute left-0 top-[6px] h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg pointer-events-none z-0"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span>{formatTime(duration || 0)}</span>
                    </div>
                </div>

                {/* Volume & Close */}
                <div className="flex items-center gap-4 w-full md:w-1/4 justify-end">
                    <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-20 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 hover:text-rose-400 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={currentTrack.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden"
            />
        </div>
    );
}
