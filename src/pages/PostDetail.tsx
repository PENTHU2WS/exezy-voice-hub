import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
// import { db } from '../lib/config';
// import {
//     doc, getDoc, collection, query, orderBy, onSnapshot,
//     addDoc, serverTimestamp, updateDoc, increment
// } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import {
    MessageSquare, Heart, Eye, Share2, ArrowLeft,
    Send, Loader2, Hash
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    userName: string;
    userAvatar: string;
    channel: string;
    tags: string[];
    likes: number;
    views: number;
    commentCount?: number;
    createdAt: any;
}

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    createdAt: any;
}

export function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        const fetchPost = async () => {
             const mockPost = {
                 id: id,
                 title: 'Mock Post',
                 content: 'This is a mock post during appwrite migration.',
                 userId: 'mock-user',
                 userName: 'Mock Author',
                 userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mock',
                 channel: 'General',
                 tags: ['React'],
                 likes: 0,
                 views: 0,
                 createdAt: new Date().toISOString()
             } as any;
             setPost(mockPost);
             setLoading(false);
             setComments([]);
        };

        fetchPost();
    }, [id, navigate]);

    const handleLike = async () => {
        if (!user || !post || liking) return;
        setLiking(true);
        // Mock Like
        setPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        setLiking(false);
    };

    const handleComment = async () => {
        if (!user || !id || !newComment.trim()) return;
        setPostingComment(true);
        try {
            // Mock comment
            const newCommentObj = {
                id: Date.now().toString(),
                text: newComment.trim(),
                userId: (user as any).uid || (user as any).$id,
                userName: profile?.username || 'User',
                userAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user as any).$id || (user as any).uid}`,
                createdAt: { toDate: () => new Date() }
            };
            setComments(prev => [...prev, newCommentObj]);
            setNewComment('');
            
            // Mock increment
            setPost(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : null);
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setPostingComment(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen bg-black">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!post) return null;

    return (
        <Layout>
            <div className="min-h-screen bg-black text-white pb-12">
                <div className="container mx-auto px-4 py-8 max-w-6xl">

                    <Link to="/community" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 font-medium text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Community
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT CONTENT - POST (2/3) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* POST CARD */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-8 shadow-xl">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={post.userAvatar}
                                        alt={post.userName}
                                        className="w-12 h-12 rounded-full border border-gray-800"
                                    />
                                    <div>
                                        <h1 className="text-2xl font-bold text-white leading-tight">{post.title}</h1>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <span className="text-purple-400 font-bold">{post.userName}</span>
                                            <span>•</span>
                                            <span>{post.createdAt ? formatDistanceToNow(post.createdAt.seconds ? new Date(post.createdAt.seconds * 1000) : post.createdAt, { addSuffix: true }) : 'Just now'}</span>
                                            {post.channel && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-[#222] px-2 py-0.5 rounded text-gray-300">{post.channel}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="prose prose-invert prose-purple max-w-none mb-8">
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {post.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 text-xs text-gray-400 bg-[#1a1a1e] px-2 py-1 rounded border border-[#333]">
                                                <Hash className="w-3 h-3" /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-6 border-t border-[#222] pt-6">
                                    <button
                                        onClick={handleLike}
                                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${liking ? 'opacity-50' : ''} hover:text-red-500 text-gray-400`}
                                    >
                                        <Heart className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                                        {post.likes}
                                    </button>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                        <MessageSquare className="w-5 h-5" />
                                        {comments.length}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-400 ml-auto">
                                        <Eye className="w-5 h-5" />
                                        {post.views}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert("Link copied!");
                                        }}
                                        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* COMMENTS SECTION */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-8 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-500" /> Comments
                                </h3>

                                {/* Comment Input */}
                                {user ? (
                                    <div className="flex gap-4 mb-8">
                                        <img
                                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                                            alt="Me"
                                            className="w-10 h-10 rounded-full border border-gray-700"
                                        />
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full bg-[#151518] border border-[#333] rounded-xl p-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 min-h-[100px] resize-y"
                                            />
                                            <div className="absolute bottom-3 right-3">
                                                <button
                                                    onClick={handleComment}
                                                    disabled={postingComment || !newComment.trim()}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {postingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Post <Send className="w-3 h-3" /></>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#151518] rounded-xl p-6 text-center mb-8 border border-[#222]">
                                        <p className="text-gray-400 mb-2">Join the conversation</p>
                                        <Link to="/auth" className="text-purple-400 font-bold hover:underline">Sign in to comment</Link>
                                    </div>
                                )}

                                {/* Comment List */}
                                <div className="space-y-6">
                                    {comments.length > 0 ? comments.map(comment => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <Link to={`/profile/${comment.userId}`}>
                                                <img
                                                    src={comment.userAvatar}
                                                    alt={comment.userName}
                                                    className="w-10 h-10 rounded-full border border-gray-800"
                                                />
                                            </Link>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-200 text-sm">{comment.userName}</span>
                                                        <span className="text-xs text-gray-600">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'now'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-gray-400 text-sm leading-relaxed bg-[#151518] border border-[#222] p-3 rounded-r-xl rounded-bl-xl group-hover:border-[#333] transition-colors">
                                                    {comment.text}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 border border-dashed border-[#222] rounded-xl">
                                            <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-500">No comments yet. Be the first!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT SIDEBAR (1/3) */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Author Card Stats */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-6 shadow-xl">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">About Author</h4>
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={post.userAvatar}
                                        alt={post.userName}
                                        className="w-14 h-14 rounded-full border-2 border-purple-500/20"
                                    />
                                    <div>
                                        <div className="font-bold text-white text-lg">{post.userName}</div>
                                        <div className="text-xs text-gray-500">Community Member</div>
                                    </div>
                                </div>
                                <Link to={`/profile/${post.userId}`}>
                                    <Button className="w-full bg-[#151518] hover:bg-[#222] text-white border border-[#333]">
                                        View Profile
                                    </Button>
                                </Link>
                            </div>

                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-3xl p-6">
                                <h4 className="font-bold text-white mb-2">Community Guidelines</h4>
                                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                    Please keep discussions respectful and on-topic. Share code snippets using markdown blocks for better readability.
                                </p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
