import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Minus } from 'lucide-react';
import { useSocialStore } from '../../store/socialStore';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';

export function DirectMessageWidget() {
    const { friends, messages, sendMessage } = useSocialStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeFriend = friends.find(f => f.id === activeChatId);
    const currentMessages = activeChatId ? (messages[activeChatId] || []) : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentMessages, activeChatId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeChatId) return;
        sendMessage(activeChatId, inputText);
        setInputText('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4 pointer-events-none">

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#121212] border border-white/10 w-80 h-96 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-neon-violet/10 p-3 border-b border-white/5 flex items-center justify-between">
                            {activeChatId ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setActiveChatId(null)} className="hover:bg-white/10 p-1 rounded">
                                        <ArrowLeftIcon className="w-4 h-4" />
                                    </button>
                                    <div className="relative">
                                        <img src={activeFriend?.avatar_url} className="w-8 h-8 rounded-full" alt="User" />
                                        <span className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black",
                                            activeFriend?.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                                        )} />
                                    </div>
                                    <span className="font-bold text-sm text-white">{activeFriend?.username}</span>
                                </div>
                            ) : (
                                <span className="font-bold text-white px-2">Messages</span>
                            )}
                            <div className="flex gap-1">
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-black/20 p-4">
                            {!activeChatId ? (
                                // Friend List
                                <div className="space-y-1">
                                    {friends.map(friend => (
                                        <div
                                            key={friend.id}
                                            onClick={() => setActiveChatId(friend.id)}
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            <div className="relative">
                                                <img src={friend.avatar_url} alt={friend.username} className="w-10 h-10 rounded-full bg-white/10" />
                                                <span className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121212]",
                                                    friend.status === 'online' ? 'bg-green-500' :
                                                        friend.status === 'coding' ? 'bg-yellow-500' : 'bg-gray-500'
                                                )} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{friend.username}</p>
                                                <p className="text-xs text-gray-500 capitalize">{friend.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {friends.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">No friends yet.</p>}
                                </div>
                            ) : (
                                // Chat Messages
                                <div className="space-y-3">
                                    {currentMessages.length > 0 ? currentMessages.map(msg => (
                                        <div key={msg.id} className={cn("flex", msg.senderId === 'me' ? "justify-end" : "justify-start")}>
                                            <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                                                msg.senderId === 'me' ? "bg-neon-violet text-white" : "bg-white/10 text-gray-200"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-gray-600 text-xs mt-4">Start a conversation with {activeFriend?.username}</p>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area (Only inside chat) */}
                        {activeChatId && (
                            <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
                                <input
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-neon-violet focus:outline-none"
                                />
                                <Button type="submit" size="icon" className="h-9 w-9 bg-neon-violet hover:bg-neon-violet/90">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-neon-violet text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center pointer-events-auto"
                >
                    <MessageSquare className="w-6 h-6 fill-current" />
                </motion.button>
            )}
        </div>
    );
}

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
    )
}
