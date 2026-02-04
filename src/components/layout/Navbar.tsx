import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../common/Button';
import { Search, Upload, User as UserIcon, Bell, LogOut, Settings, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocialStore } from '../../store/socialStore';
import { cn } from '../../lib/utils';
import { GlobalSearch } from '../features/GlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export function Navbar() {
    const { user, signOut } = useAuthStore();
    const { notifications, fetchNotifications, markRead, markAllRead } = useSocialStore();
    const location = useLocation();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);

    // Unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (user) {
            fetchNotifications(user.id);
            // Polling notifications every 60s
            const interval = setInterval(() => fetchNotifications(user.id), 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Explore', path: '/explore' },
        { label: 'Community', path: '/community' },
        { label: 'Docs', path: '/docs' },
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="container mx-auto h-full px-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold font-mono group-hover:bg-neon-violet group-hover:text-white transition-colors">
                            &lt;/&gt;
                        </div>
                        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 group-hover:from-white group-hover:to-neon-violet transition-all uppercase tracking-tighter">
                            DevHub
                        </span>
                    </Link>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center bg-white/5 rounded-full px-2 py-1 border border-white/5">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all',
                                    location.pathname === item.path
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                                        : 'text-gray-500 hover:text-white'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Search</span>
                            <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-black px-1.5 text-[8px] text-gray-600 transition-colors">
                                CTRL K
                            </kbd>
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                {/* Upload Button */}
                                <Link to="/upload">
                                    <Button size="sm" className="hidden sm:flex h-9 gap-2 bg-neon-violet hover:bg-neon-violet/90 text-[10px] font-black uppercase tracking-widest border-none px-5">
                                        <Upload className="w-4 h-4" />
                                        Upload
                                    </Button>
                                </Link>

                                {/* Notifications */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifs(!showNotifs)}
                                        className={cn(
                                            "relative w-9 h-9 flex items-center justify-center rounded-full transition-all border",
                                            showNotifs ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20"
                                        )}
                                    >
                                        <Bell className="w-4 h-4" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-black text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {showNotifs && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-4 w-80 bg-[#0a0a0a] border border-purple-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                                            >
                                                <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Signals ({unreadCount})</span>
                                                    <button
                                                        onClick={() => markAllRead(user.id)}
                                                        className="text-[9px] font-black text-purple-500 hover:text-purple-400 flex items-center gap-1 uppercase tracking-tighter"
                                                    >
                                                        <CheckCheck className="w-3 h-3" /> Mark Read
                                                    </button>
                                                </div>
                                                <div className="max-h-[400px] overflow-y-auto py-1 custom-scrollbar">
                                                    {notifications.length > 0 ? Array.from(notifications).map(n => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markRead(n.id)}
                                                            className={cn(
                                                                "px-5 py-4 cursor-pointer border-b border-white/5 last:border-0 transition-all group",
                                                                !n.read ? 'bg-purple-500/5' : 'hover:bg-white/[0.02]'
                                                            )}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={cn(
                                                                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-all",
                                                                    !n.read ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-gray-800"
                                                                )} />
                                                                <div className="flex-1 space-y-1">
                                                                    <p className={cn("text-xs leading-relaxed", !n.read ? "text-white font-bold" : "text-gray-500")}>
                                                                        {n.message}
                                                                    </p>
                                                                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                                                                        {formatDistanceToNow(new Date(n.created_at))} ago
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="py-12 flex flex-col items-center justify-center opacity-30 gap-4">
                                                            <Bell className="w-8 h-8 text-gray-500" />
                                                            <span className="text-[10px] uppercase font-black tracking-widest">No Signals Detected</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* User Menu */}
                                <div className="relative">
                                    <div
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-all overflow-hidden"
                                    >
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-purple-400" />
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {showUserMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-4 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-[100]"
                                            >
                                                <div className="px-5 py-3 border-b border-white/5 mb-1">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Profile Root</p>
                                                    <p className="text-xs font-bold text-white truncate">@{user.user_metadata?.username || 'user'}</p>
                                                </div>
                                                <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-[11px] font-black uppercase text-gray-400 hover:bg-white/5 hover:text-white transition-colors tracking-widest">
                                                    <UserIcon className="w-3.5 h-3.5" /> Workspace
                                                </Link>
                                                <Link to="/edit-profile" className="flex items-center gap-3 px-5 py-2.5 text-[11px] font-black uppercase text-gray-400 hover:bg-white/5 hover:text-white transition-colors tracking-widest">
                                                    <Settings className="w-3.5 h-3.5" /> Configs
                                                </Link>
                                                <div className="h-px bg-white/5 my-2" />
                                                <button
                                                    onClick={() => { signOut(); window.location.reload(); }}
                                                    className="w-full text-left flex items-center gap-3 px-5 py-2.5 text-[11px] font-black uppercase text-red-500 hover:bg-red-500/10 transition-colors tracking-widest"
                                                >
                                                    <LogOut className="w-3.5 h-3.5" /> Terminate Session
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <Link to="/auth">
                                <Button size="sm" variant="secondary" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest">
                                    Initiate
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
