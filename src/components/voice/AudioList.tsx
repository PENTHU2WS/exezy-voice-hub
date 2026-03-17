import { Play, Clock, User, Download, Share2 } from 'lucide-react';
import { VoiceNote } from '../../types/voice';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { animate, stagger } from 'animejs';
import { useEffect } from 'react';

interface AudioListProps {
    notes: VoiceNote[];
    currentTrack?: VoiceNote | null;
    onSelect: (note: VoiceNote) => void;
    category: string;
}

export function AudioList({ notes, currentTrack, onSelect, category }: AudioListProps) {

    useEffect(() => {
        animate('.track-item', {
            translateX: [20, 0],
            opacity: [0, 1],
            delay: stagger(50),
            duration: 500,
            easing: 'easeOutCubic'
        });
    }, [notes]);

    return (
        <div className="flex-1 flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Browsing: <span className="text-purple-500">{category}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{notes.length} nodes found in this sector.</p>
                </div>
            </div>

            <div className="space-y-2">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        onClick={() => onSelect(note)}
                        className={cn(
                            "track-item group flex items-center gap-4 p-3 rounded-xl border border-white/5 cursor-pointer transition-all",
                            currentTrack?.id === note.id
                                ? "bg-purple-500/10 border-purple-500/30 scale-[1.01] shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                                : "hover:bg-white/5 hover:border-white/10"
                        )}
                    >
                        {/* Play Icon / Visualizer */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 group-hover:bg-purple-500/20">
                            {currentTrack?.id === note.id ? (
                                <div className="flex items-center gap-0.5 h-4">
                                    <div className="w-0.5 h-full bg-purple-500 animate-[bounce_0.8s_infinite]" />
                                    <div className="w-0.5 h-full bg-purple-500 animate-[bounce_1.2s_infinite]" />
                                    <div className="w-0.5 h-full bg-purple-500 animate-[bounce_0.9s_infinite]" />
                                </div>
                            ) : (
                                <Play className="w-4 h-4 text-gray-400 group-hover:text-purple-400 fill-current" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                "text-sm font-bold truncate transition-colors",
                                currentTrack?.id === note.id ? "text-purple-400" : "text-gray-200 group-hover:text-white"
                            )}>
                                {note.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <User className="w-3 h-3" />
                                    {note.uploaderName}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {note.duration}
                                </span>
                            </div>
                        </div>

                        {/* Action Date */}
                        <div className="hidden md:flex flex-col items-end gap-1">
                            <span className="text-[10px] text-gray-500 font-mono">
                                {note.createdAt ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true }) : 'recent'}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                    <Download className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                    <Share2 className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Music className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-white font-bold">No nodes found</h3>
                        <p className="text-gray-500 text-sm mt-1">This category is currently empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Music(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    )
}
