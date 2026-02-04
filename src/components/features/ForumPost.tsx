import { Heart, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Button } from '../common/Button';
import { ForumPost as IForumPost } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface ForumPostProps {
    post: IForumPost;
}

export function ForumPost({ post }: ForumPostProps) {
    const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'just now';

    // Derived Badge Logic
    const isHelp = post.channel === 'help';
    const isDiscussion = post.channel === 'general' || post.channel === 'engineering';
    const isQuestion = post.channel === 'showcase'; // Logic mapping

    return (
        <div className="p-4 rounded-xl bg-dev-card border border-white/5 hover:border-white/10 transition-colors mb-4 group relative cursor-pointer">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    {/* Author Avatar */}
                    <img
                        src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.username || 'User'}`}
                        alt={post.author?.username || 'User'}
                        className="w-10 h-10 rounded-full border border-white/10 object-cover"
                    />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{post.author?.username || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">{timeAgo}</span>

                            {/* Post Type Badge */}
                            {isHelp && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 border border-red-500/20">HELP</span>}
                            {isDiscussion && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20">DISCUSSION</span>}
                            {isQuestion && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">SHOWCASE</span>}
                        </div>

                        <h3 className="font-semibold text-white mb-1 group-hover:text-neon-violet transition-colors">
                            {post.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3 max-w-xl">{post.content}</p>

                        {/* Interaction Bar */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.comments_count || 0}</span>
                            </button>
                            <button className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                </Button>
            </div>

            {/* Activity Indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-1/2 bg-neon-violet opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />
        </div>
    );
}
