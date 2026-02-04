import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import {
    Edit2, Star, Users, Layers, Zap, Loader2, X, UserPlus, UserCheck
} from 'lucide-react';
import { ProjectCard } from '../components/features/ProjectCard';
import { useAuthStore, getRankConfig, getNextLevelXp } from '../store/authStore';
import { useSocialStore } from '../store/socialStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export function Profile() {
    const { user, profile, loading: authLoading } = useAuthStore();
    const { followers, following, loading: networkLoading, fetchNetwork, unfollow } = useSocialStore();

    const [activeTab, setActiveTab] = useState<'projects' | 'activity' | 'stars'>('projects');
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState({ projectCount: 0, likesCount: 0 });
    const [profileLoading, setProfileLoading] = useState(false);

    // Modal State
    const [showNetworkModal, setShowNetworkModal] = useState<'followers' | 'following' | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!profile) return;
            setProfileLoading(true);
            try {
                // Fetch User Projects
                const query = supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                const { data: userProjects } = await query;
                if (userProjects) {
                    setProjects(userProjects as Project[]);
                    const totalLikes = userProjects.reduce((acc: number, curr: any) => acc + (curr.likes || 0), 0);
                    setStats({
                        projectCount: userProjects.length,
                        likesCount: totalLikes
                    });
                }

                // Fetch real-time following/followers
                await fetchNetwork(profile.id);
            } catch (error) {
                console.error("Profile Data Error:", error);
            } finally {
                setProfileLoading(false);
            }
        };

        if (profile) fetchData();
    }, [profile]);

    const handleNetworkAction = async (targetId: string, isUnfollow: boolean) => {
        if (!user) return;
        if (isUnfollow) {
            await unfollow(user.id, targetId);
        } else {
            // Follow Back Logic
            await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
            await fetchNetwork(user.id); // Refresh
        }
    };

    if (authLoading || (user && !profile)) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen bg-black">
                    <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!profile) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center px-4">
                    <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Identity Not Verified</h2>
                    <p className="text-gray-500 mb-6">Access restricted to authenticated architects only.</p>
                    <Button onClick={() => navigate('/auth')}>Initiate Login</Button>
                </div>
            </Layout>
        );
    }

    const currentRank = getRankConfig(profile.xp);
    const nextLevelXp = getNextLevelXp(profile.xp);
    const prevLevelXp = currentRank.min;
    const progressPercent = Math.min(100, Math.max(0, ((profile.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

    return (
        <Layout>
            <div className="min-h-screen bg-black pt-8 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">

                    {/* Header Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[3rem] bg-[#0a0a0a] border border-white/5 p-10 mb-10 relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                            <div className="relative">
                                <div className="w-36 h-36 rounded-full p-1.5 border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <img src={profile.avatar_url || "https://github.com/shadcn.png"} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-black border border-purple-500 text-purple-400 shadow-xl tracking-widest whitespace-nowrap">
                                    {profile.rank}
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{profile.full_name || 'Anonymous Apex'}</h1>
                                    <p className="text-purple-500 font-black text-xs uppercase tracking-[0.3em] mt-2">@{profile.username}</p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <Link to="/edit-profile">
                                        <Button variant="outline" className="h-10 border-white/10 hover:border-purple-500/50 text-[10px] uppercase font-black tracking-widest gap-2">
                                            <Edit2 className="w-3.5 h-3.5" /> Configure Terminal
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="hidden lg:grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setShowNetworkModal('followers')}
                                    className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center cursor-pointer hover:border-purple-500/40 transition-all hover:bg-white/[0.08]"
                                >
                                    <p className="text-[28px] font-black text-white leading-none mb-1">{followers.length}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Followers</p>
                                </div>
                                <div
                                    onClick={() => setShowNetworkModal('following')}
                                    className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center cursor-pointer hover:border-purple-500/40 transition-all hover:bg-white/[0.08]"
                                >
                                    <p className="text-[28px] font-black text-white leading-none mb-1">{following.length}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Following</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Growth Matrix</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xl font-black text-white">{currentRank.name}</span>
                                        <div className="text-right">
                                            <span className="text-purple-500 font-mono font-black">{profile.xp}</span>
                                            <span className="text-gray-700 text-xs"> / {nextLevelXp === Infinity ? 'MAX' : nextLevelXp}</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-purple-600 to-purple-400" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Projects</span>
                                        <span className="text-white font-black">{stats.projectCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2"><Star className="w-3.5 h-3.5" /> Likes Received</span>
                                        <span className="text-white font-black">{stats.likesCount}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-10 mb-10 border-b border-white/5 px-4 overflow-x-auto whitespace-nowrap scrollbar-none">
                                {['projects', 'activity', 'stars'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={cn(
                                            "pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                            activeTab === tab ? "text-purple-500 shadow-purple-500" : "text-gray-600 hover:text-gray-400"
                                        )}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[400px]">
                                {activeTab === 'projects' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {profileLoading ? (
                                            <div className="flex justify-center py-20 col-span-full">
                                                <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
                                            </div>
                                        ) : projects.map((p, i) => (
                                            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                                <ProjectCard project={p} />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'activity' && <div className="flex flex-col items-center justify-center h-[300px] text-gray-700 font-black uppercase tracking-widest opacity-30 text-[10px]">Transmission Silence</div>}
                                {activeTab === 'stars' && <div className="flex flex-col items-center justify-center h-[300px] text-gray-700 font-black uppercase tracking-widest opacity-30 text-[10px]">No Starred Artifacts</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Modals */}
            <AnimatePresence>
                {showNetworkModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-purple-500/20 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    {showNetworkModal === 'followers' ? 'Followers' : 'Currently Following'}
                                </h3>
                                <button onClick={() => setShowNetworkModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {networkLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Querying Cloud...</span>
                                    </div>
                                ) : (showNetworkModal === 'followers' ? followers : following).length > 0 ? (
                                    (showNetworkModal === 'followers' ? followers : following).map((user) => (
                                        <div key={user.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full p-0.5 border border-white/10 overflow-hidden">
                                                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-full h-full rounded-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{user.full_name || user.username}</p>
                                                    <p className="text-[10px] font-black text-purple-500/60 uppercase tracking-widest mt-0.5">@{user.username}</p>
                                                </div>
                                            </div>

                                            {showNetworkModal === 'followers' ? (
                                                <button
                                                    onClick={() => handleNetworkAction(user.id, false)}
                                                    className="p-2 text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <UserPlus className="w-4 h-4" /> Follow Back
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleNetworkAction(user.id, true)}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <UserCheck className="w-4 h-4" /> Disconnect
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center opacity-30 italic text-sm text-gray-500 font-bold uppercase tracking-widest">
                                        No connections established.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Layout>
    );
}
