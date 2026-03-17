import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import {
    Hash, Plus, TrendingUp, Loader2, MessageSquare,
    Heart, Eye, Search, X
} from 'lucide-react';
import { cn } from '../lib/utils';
// import { db } from '../lib/config';
// import {
//     collection, query, where, getDocs,
//     addDoc, serverTimestamp, limit, updateDoc, increment, doc
// } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const CHANNELS = [
    { id: 'general', label: 'General', desc: 'The main hangout' },
    { id: 'announcements', label: 'Announcements', desc: 'News & Updates' },
    { id: 'engineering', label: 'Engineering', desc: 'Code & Tech' },
    { id: 'design', label: 'Design', desc: 'UI/UX discussion' },
    { id: 'showcase', label: 'Showcase', desc: 'Show off your work' },
    { id: 'help', label: 'Help', desc: 'Get support' },
];

export function Community() {
    const { user, profile } = useAuthStore();

    // State
    const [posts, setPosts] = useState<any[]>([]);
    const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChannel, setActiveChannel] = useState('general');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTags, setNewPostTags] = useState('');
    const [newPostChannel, setNewPostChannel] = useState('general');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Posts
    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Mock posts
            setPosts([]);
        } catch (error) {
            console.error('Fetch posts error:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Trending
    const fetchTrending = async () => {
        try {
            // Mock trending
            setTrendingPosts([]);
        } catch (error) {
            console.error("Trending fetch error:", error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [activeChannel]);

    useEffect(() => {
        fetchTrending();
    }, []);

    const handleCreatePost = async () => {
        if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;
        setSubmitting(true);

        try {
            const tagsArray = newPostTags.split(',').map(tag => tag.trim()).filter(t => t.length > 0);

            const newPost = {
                id: Date.now().toString(),
                title: newPostTitle,
                content: newPostContent,
                tags: tagsArray,
                channel: newPostChannel,
                userId: user.uid,
                userName: profile?.username || 'Anonymous',
                userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                likes: 0,
                views: 0,
                commentCount: 0,
                createdAt: { toDate: () => new Date() }
            };

            setPosts(prev => [newPost, ...prev]);

            setIsModalOpen(false);
            setNewPostTitle('');
            setNewPostContent('');
            setNewPostTags('');
        } catch (error) {
            console.error("Create post error:", error);
            alert("Failed to create post.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (e: React.MouseEvent, postId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return; // Prompt login

        // Optimistic update
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    };

    const activeChannelData = CHANNELS.find(c => c.id === activeChannel);

    return (
        <Layout>
            <div className="flex min-h-screen bg-black pt-0">

                {/* LEFT SIDEBAR - CHANNELS (Fixed Width) */}
                <div className="hidden md:flex flex-col w-64 border-r border-[#222] bg-[#09090b] fixed h-full pt-20">
                    <div className="px-6 mb-6">
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-10 shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Post
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 space-y-1">
                        <div className="px-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Feeds</div>
                        {CHANNELS.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    activeChannel === channel.id
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                        : "text-gray-400 hover:bg-[#151518] hover:text-gray-200"
                                )}
                            >
                                <Hash className="w-4 h-4" />
                                <span className="flex-1 text-left">{channel.label}</span>
                                {activeChannel === channel.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN FEED (Fluid Width) */}
                <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                    {/* Header */}
                    <div className="h-16 border-b border-[#222] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 lg:px-10">
                        <div className="flex items-center gap-4">
                            <div className="md:hidden">
                                {/* Mobile Menu Trigger could go here */}
                                <Hash className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="text-purple-500">#</span> {activeChannelData?.label}
                                </h2>
                                <p className="text-xs text-gray-500 hidden sm:block">{activeChannelData?.desc}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Search bar could go here */}
                            <div className="relative hidden lg:block w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search topics..."
                                    className="w-full bg-[#151518] border border-[#222] rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-purple-600 md:hidden p-2 rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                                <p className="text-gray-500 text-sm">Loading community feed...</p>
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map(post => (
                                <Link to={`/community/post/${post.id}`} key={post.id}>
                                    <div className="bg-[#09090b] border border-[#222] hover:border-purple-500/30 rounded-2xl p-6 transition-all cursor-pointer group mb-4">
                                        <div className="flex gap-4">
                                            {/* Vote Column (Reddit style) */}
                                            <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                                <button
                                                    onClick={(e) => handleLike(e, post.id)}
                                                    className="p-1 rounded hover:bg-[#222] text-gray-500 hover:text-purple-400 transition-colors"
                                                >
                                                    <Heart className={cn("w-5 h-5", post.likes > 0 && "fill-current text-purple-500")} />
                                                </button>
                                                <span className="text-sm font-bold text-gray-400">{post.likes || 0}</span>
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 min-w-0">
                                                {/* Meta */}
                                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                                    <img
                                                        src={post.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                        className="w-5 h-5 rounded-full border border-gray-800"
                                                    />
                                                    <span className="font-bold text-gray-300 hover:underline">{post.userName}</span>
                                                    <span>•</span>
                                                    <span>{post.createdAt ? formatDistanceToNow(post.createdAt.seconds ? new Date(post.createdAt.seconds * 1000) : post.createdAt, { addSuffix: true }) : 'Now'}</span>
                                                </div>

                                                {/* Title & Preview */}
                                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors leading-tight">
                                                    {post.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {post.content}
                                                </p>

                                                {/* Tags & Stats */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {post.tags?.slice(0, 3).map((tag: string) => (
                                                            <span key={tag} className="px-2 py-0.5 bg-[#151518] rounded border border-[#222] text-[10px] text-gray-400 font-medium">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                        <div className="flex items-center gap-1.5 hover:bg-[#151518] px-2 py-1 rounded transition-colors">
                                                            <MessageSquare className="w-4 h-4" />
                                                            {post.commentCount || 0} comments
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Eye className="w-4 h-4" />
                                                            {post.views || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-[#09090b] border border-[#222] rounded-3xl">
                                <div className="bg-[#151518] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 text-gray-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No posts here yet</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mb-6">Be the first to start a conversation in this channel.</p>
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                                >
                                    Start a Discussion
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR - TRENDING (Hidden on small screens) */}
                <div className="hidden xl:block w-80 border-l border-[#222] bg-[#09090b] fixed right-0 h-full pt-20 px-6">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-purple-500" /> Trending Topics
                        </div>

                        <div className="space-y-4">
                            {trendingPosts.length > 0 ? trendingPosts.map((post, i) => (
                                <Link to={`/community/post/${post.id}`} key={post.id} className="block group">
                                    <div className="flex gap-3 items-start">
                                        <span className="text-gray-600 font-black text-lg leading-none mt-0.5">0{i + 1}</span>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-purple-400 transition-colors line-clamp-2 mb-1">
                                                {post.title}
                                            </h4>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                <span>{post.views || 0} views</span>
                                                <span>•</span>
                                                <span>{post.likes || 0} likes</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-gray-600 text-sm">No trending posts yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/10 rounded-2xl">
                        <h4 className="font-bold text-white mb-2 text-sm">Exezy Premium</h4>
                        <p className="text-xs text-gray-400 mb-3">Get exclusive badges, styling and more with Premium.</p>
                        <Button className="w-full bg-[#151518] hover:bg-[#222] text-white border border-[#333] text-xs h-8">
                            Coming Soon
                        </Button>
                    </div>
                </div>

                {/* NEW POST MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-[#09090b] border border-[#222] w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 relative">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-black text-white mb-6">Create New Post</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Channel</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CHANNELS.map(ch => (
                                            <button
                                                key={ch.id}
                                                onClick={() => setNewPostChannel(ch.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                                    newPostChannel === ch.id
                                                        ? "bg-purple-600 text-white border-purple-600"
                                                        : "bg-[#151518] text-gray-400 border-[#333] hover:border-gray-500"
                                                )}
                                            >
                                                # {ch.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Title</label>
                                    <input
                                        value={newPostTitle}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPostTitle(e.target.value)}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-[#151518] border border-[#333] rounded-lg px-4 focus:outline-none focus:border-purple-500/50 h-12 text-lg font-bold text-white placeholder:font-normal"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Content (Markdown supported)</label>
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPostContent(e.target.value)}
                                        placeholder="Share your thoughts... Use ``` for code blocks."
                                        className="w-full bg-[#151518] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 min-h-[200px]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Tags (comma separated)</label>
                                    <input
                                        value={newPostTags}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPostTags(e.target.value)}
                                        placeholder="react, typescript, help..."
                                        className="w-full bg-[#151518] border border-[#333] rounded-lg px-4 h-10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleCreatePost}
                                        disabled={submitting || !newPostTitle.trim() || !newPostContent.trim()}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-purple-900/20"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Post'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}
