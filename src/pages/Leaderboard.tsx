import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
// import { db } from '../lib/config';
// import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile, getRankConfig } from '../store/authStore';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Loader2, MapPin } from 'lucide-react';

export function Leaderboard() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
             // Mock leaderboard fetch entirely
             setUsers([]);
             setLoading(false);
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />;
            case 1: return <Medal className="w-6 h-6 text-gray-400" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700" />;
            default: return <span className="text-gray-500 font-bold ml-2">#{index + 1}</span>;
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 min-h-screen">
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center justify-center p-4 rounded-full bg-purple-500/10 border border-yellow-500/20 mb-4"
                    >
                        <Trophy className="w-8 h-8 text-yellow-500" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Architects</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        The top contributors shaping the future of the network.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {users.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-purple-500/30 hover:bg-white/5 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="w-12 flex justify-center">
                                    {getRankIcon(index)}
                                </div>

                                <div className="w-12 h-12 rounded-full border border-white/10 p-0.5 relative">
                                    <img
                                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                        alt={user.username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${index < 3 ? 'bg-green-500' : 'bg-gray-500'}`} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors">
                                        {user.full_name || user.username}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        <span className={user.rank === 'Legend' ? 'text-purple-500' : 'text-gray-400'}>{user.rank}</span>
                                        {user.location && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.location}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-black text-white group-hover:text-yellow-500 transition-colors">
                                        {user.xp?.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-600 uppercase font-black tracking-widest">XP Earned</div>
                                </div>
                            </motion.div>
                        ))}

                        {users.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                No architects found in the database.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}


