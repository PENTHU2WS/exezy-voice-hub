import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ForumPost as PostCard } from '../components/features/ForumPost';
import { Button } from '../components/common/Button';
import { Hash, Plus, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { ForumPost, UserProfile } from '../types';

const CHANNELS = [
    { id: 'general', label: 'General', desc: 'The main hangout' },
    { id: 'announcements', label: 'Announcements', desc: 'News & Updates' },
    { id: 'engineering', label: 'Engineering', desc: 'Code & Tech' },
    { id: 'design', label: 'Design', desc: 'UI/UX discussion' },
    { id: 'showcase', label: 'Showcase', desc: 'Show off your work' },
    { id: 'help', label: 'Help', desc: 'Get support' },
];

export function Community() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChannel, setActiveChannel] = useState('general');

    const fetchPosts = async () => {
        setLoading(true);
        try {
            // 1. Fetch Posts
            let query = supabase.from('forum_posts').select('*').order('created_at', { ascending: false });

            if (activeChannel !== 'general') {
                query = query.eq('channel', activeChannel);
            }

            const { data: postsData, error: postsError } = await query;

            if (postsError) throw postsError;

            if (postsData) {
                // 2. Fetch Authors
                const userIds = Array.from(new Set(postsData.map((p: any) => p.user_id)));
                if (userIds.length > 0) {
                    const { data: usersData, error: usersError } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', userIds);

                    if (!usersError && usersData) {
                        // Merge
                        const mergedPosts = postsData.map((post: any) => ({
                            ...post,
                            author: usersData.find((u: UserProfile) => u.id === post.user_id)
                        }));
                        setPosts(mergedPosts as ForumPost[]);
                    } else {
                        setPosts(postsData as ForumPost[]);
                    }
                } else {
                    setPosts(postsData as ForumPost[]);
                }
            }

        } catch (err) {
            console.error("Community Load Error:", err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [activeChannel]);

    // Active Channel Info
    const currentChannelInfo = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)] overflow-hidden">
                <div className="grid grid-cols-12 gap-8 h-full">

                    {/* Left Sidebar - Channels */}
                    <div className="col-span-3 hidden md:flex flex-col gap-6 overflow-y-auto pr-2">
                        <div className="p-4 rounded-xl bg-dev-card border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Online</span>
                                <span className="flex items-center gap-1.5 text-xs text-neon-violet bg-neon-violet/10 px-2 py-0.5 rounded-full border border-neon-violet/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-pulse" />
                                    124 Online
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Channels</h3>
                            <div className="space-y-1">
                                {CHANNELS.map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setActiveChannel(channel.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                                            activeChannel === channel.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <Hash className="w-4 h-4 opacity-50" />
                                        <span>{channel.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center - Feed */}
                    <div className="col-span-12 md:col-span-6 flex flex-col h-full overflow-hidden">
                        {/* Feed Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Hash className="w-5 h-5 text-neon-violet" />
                                    <h2 className="text-xl font-bold">{currentChannelInfo.label}</h2>
                                </div>
                                <p className="text-sm text-gray-400">{currentChannelInfo.desc}</p>
                            </div>
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                New Post
                            </Button>
                        </div>

                        {/* Posts */}
                        <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    Henüz içerik yok
                                </div>
                            ) : (
                                posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Trending */}
                    <div className="col-span-3 hidden lg:flex flex-col gap-6 overflow-y-auto pl-2">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <TrendingUp className="w-4 h-4 text-neon-violet" />
                            <h3 className="font-bold text-white">Trending Now</h3>
                        </div>

                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-xl bg-dev-card border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                    <TrendingUp className="w-3 h-3 text-neon-violet" />
                                    <span>Trending #{i}</span>
                                </div>
                                <p className="font-medium text-sm text-white mb-2 group-hover:text-neon-violet transition-colors">
                                    "How to optimize Supabase queries?"
                                </p>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                    <div className="bg-neon-violet h-full w-[70%]" style={{ width: `${85 - i * 15}%` }} />
                                </div>
                                <div className="mt-2 text-[10px] text-right text-gray-500">
                                    {245 - i * 12} active viewers
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </Layout>
    );
}
