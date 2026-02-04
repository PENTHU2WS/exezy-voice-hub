import { useState, useEffect, useRef } from 'react';
import { Search, X, Command, User, Folder, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Mock Results logic
    const results = query.length > 0 ? [
        { type: 'project', title: 'Neon Dashboard', id: '1', subtitle: 'React • TypeScript' },
        { type: 'user', title: 'sarah_dev', id: '1', subtitle: 'Full Stack Developer' },
        { type: 'project', title: 'AI Chatbot', id: '2', subtitle: 'Python • OpenAI' },
        { type: 'user', title: 'alex_code', id: '2', subtitle: 'Backend Engineer' },
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase())) : [];

    const handleSelect = (item: any) => {
        onClose();
        if (item.type === 'project') navigate(`/project/${item.id}`);
        else navigate(`/profile`); // ideally /profile/:id
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
                    >
                        {/* Search Header */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                            <Search className="w-5 h-5 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search projects, users, or commands..."
                                className="flex-1 bg-transparent text-lg text-white placeholder:text-gray-600 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 text-xs text-gray-400">
                                    ESC
                                </kbd>
                                <button onClick={onClose} className="text-gray-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div className="overflow-y-auto p-2">
                            {query === '' ? (
                                <div className="py-12 text-center text-gray-500">
                                    <Command className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Type to search across DevHub...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelect(item)}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 group flex items-center justify-between transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center border border-white/5",
                                                    item.type === 'project' ? "bg-neon-violet/10 text-neon-violet" : "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {item.type === 'project' ? <Folder className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium group-hover:text-neon-violet transition-colors">{item.title}</p>
                                                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500">
                                    <p>No results found for "{query}"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] text-[10px] text-gray-600 flex justify-between">
                            <span>ProTip: Use # to search tags</span>
                            <span>DevHub Search v1.0</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
