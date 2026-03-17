import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/authStore';
import { db, auth } from '../lib/config';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, arrayUnion, arrayRemove, doc, updateDoc, increment, limit } from 'firebase/firestore';
import { Image as ImageIcon, Send, Heart, MessageCircle, MoreHorizontal, Bookmark, Code, Hash, Trophy, Sparkles, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

/* --- Interfaces & Parsers from Before --- */
export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likedBy?: string[];
  commentsCount: number;
  createdAt: any;
}

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: any;
}

const renderFormattedContent = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3);
      return (
        <pre key={index} className="bg-[#0c0c0c] p-4 rounded-xl my-3 font-mono text-[13px] overflow-x-auto text-cyan-50 border border-white/5 shadow-inner whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code key={index} className="bg-[#0c0c0c] px-1.5 py-0.5 rounded-md font-mono text-[13px] text-fuchsia-400 border border-white/5">
          {code}
        </code>
      );
    }
    
    const wordRegex = /\b(const|let|var|function|return|import|export|await|async|interface|type)\b/g;
    const pieces = part.split(wordRegex);
    
    return (
      <span key={index}>
        {pieces.map((piece, pIndex) => {
          if (wordRegex.test(piece)) {
            wordRegex.lastIndex = 0;
            return <span key={pIndex} className="text-fuchsia-400 font-mono font-medium">{piece}</span>;
          }
          return <span key={pIndex}>{piece}</span>;
        })}
      </span>
    );
  });
};

/* --- Post Item Component --- */
function PostItem({ post }: { post: Post }) {
  const { user, profile } = useAuthStore();
  const currentUserId = auth.currentUser?.uid || user?.uid || (user as any)?.$id || null;
  const isLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;
  const likesCount = post.likedBy?.length || 0;

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPublishingComment, setIsPublishingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!showComments) return;
    setLoadingComments(true);
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(comms);
      setLoadingComments(false);
    }, (err) => {
      console.error("Error fetching comments", err);
      setLoadingComments(false);
    });
    return () => unsubscribe();
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!currentUserId) return;
    try {
        const postRef = doc(db, 'posts', post.id);
        if (isLiked) {
            await updateDoc(postRef, { likedBy: arrayRemove(currentUserId) });
        } else {
            await updateDoc(postRef, { likedBy: arrayUnion(currentUserId) });
        }
    } catch (err) {
        console.error("Error toggling like:", err);
    }
  };

  const handlePublishComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !commentText.trim()) return;

    setIsPublishingComment(true);
    try {
        const authorName = profile?.username || auth.currentUser?.displayName || 'User';
        const authorAvatar = profile?.avatar_url || auth.currentUser?.photoURL || '';

        await addDoc(collection(db, 'posts', post.id, 'comments'), {
            text: commentText.trim(),
            userId: currentUserId,
            authorName,
            authorAvatar,
            createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'posts', post.id), {
            commentsCount: increment(1)
        });
        setCommentText('');
    } catch (err) {
        console.error("Error publishing comment:", err);
    } finally {
        setIsPublishingComment(false);
    }
  };

  let createdAtText = 'just now';
  if (post.createdAt && typeof post.createdAt.toDate === 'function') {
      createdAtText = formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true });
  }

  const [imgError, setImgError] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f0f0f] border border-white/5 rounded-2xl mb-6 w-full shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      {/* Premium Gradient Border Top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-fuchsia-500/50 via-cyan-400/50 to-transparent"></div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.userId}`} className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-fuchsia-600 to-cyan-600 p-[1.5px] shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    {(post.authorAvatar && !imgError) ? (
                    <img 
                        src={post.authorAvatar} 
                        alt={post.authorName} 
                        className="w-full h-full object-cover" 
                        onError={() => setImgError(true)}
                    />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[11px] font-bold">
                        {post.authorName?.substring(0, 2).toUpperCase() || 'UX'}
                    </div>
                    )}
                </div>
            </Link>
            <div className="flex flex-col">
              <Link to={`/profile/${post.userId}`} className="font-bold text-white text-[15px] hover:text-cyan-400 transition-colors tracking-tight">
                {post.authorName || 'User'}
              </Link>
              <span className="text-gray-500 text-[12px] font-medium">{createdAtText}</span>
            </div>
          </div>
          <button className="text-gray-600 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {post.content && (
          <div className="text-[14px] text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
            {renderFormattedContent(post.content)}
          </div>
        )}

        {post.imageUrl && (
          <div className="w-full rounded-xl overflow-hidden mb-4 border border-white/5 bg-black">
            <img src={post.imageUrl} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
            >
              <Heart className={cn(
                "w-5 h-5 transition-all duration-300", 
                isLiked 
                  ? "fill-fuchsia-500 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" 
                  : "text-gray-500 group-hover/btn:text-fuchsia-400"
              )} />
              <span className={cn("text-xs font-bold", isLiked ? "text-fuchsia-500" : "text-gray-500")}>
                  {likesCount > 0 ? likesCount : 'Like'}
              </span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
            >
              <MessageCircle className="w-5 h-5 text-gray-500 group-hover/btn:text-cyan-400 transition-colors" />
              <span className="text-xs font-bold text-gray-500 group-hover/btn:text-cyan-400">
                  {post.commentsCount > 0 ? post.commentsCount : 'Comment'}
              </span>
            </button>
            
            <button className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group/btn">
              <Send className="w-5 h-5 text-gray-500 group-hover/btn:text-white transition-colors" />
            </button>
          </div>

          <button className="text-gray-500 hover:text-white transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
            {showComments && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
            >
                <div className="space-y-4 mb-4">
                {loadingComments ? (
                    <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 text-cyan-500 animate-spin" /></div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 text-[13px] leading-relaxed">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mt-0.5">
                             {comment.authorAvatar ? (
                                <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                                    {comment.authorName?.[0]}
                                </div>
                             )}
                        </div>
                        <div>
                            <Link to={`/profile/${comment.userId}`} className="font-bold text-white hover:text-cyan-400 mr-2">
                                {comment.authorName}
                            </Link>
                            <span className="text-gray-300 break-words">{renderFormattedContent(comment.text)}</span>
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="text-[12px] text-gray-500 italic">No nodes attached yet.</div>
                )}
                </div>

                {currentUserId && (
                <form onSubmit={handlePublishComment} className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                        {profile?.avatar_url || auth.currentUser?.photoURL ? (
                            <img src={profile?.avatar_url || auth.currentUser?.photoURL || ''} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px] bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                            {(profile?.username || auth.currentUser?.displayName || 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Inject variable..."
                        className="flex-1 bg-white/5 border border-transparent rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:border-white/10 focus:bg-white/10 transition-all"
                    />
                    {commentText.trim() && (
                        <button type="submit" disabled={isPublishingComment} className="text-cyan-400 font-bold text-[13px] hover:text-cyan-300 px-2 transition-colors">
                            {isPublishingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Push'}
                        </button>
                    )}
                </form>
                )}
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* --- Main Feed View (The Megalomaniac 3-Col Layout) --- */
export function Feed() {
  const { user, profile } = useAuthStore();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time Sidebar Data
  const [userPostCount, setUserPostCount] = useState(0);
  const [topNodes, setTopNodes] = useState<{name: string, score: number, img: string}[]>([]);
  const [trendingTags, setTrendingTags] = useState<{tag: string, count: number}[]>([]);
  
  // Composer State
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      
      // Calculate Sidebars Data from Posts
      if (user || auth.currentUser) {
          const currentUuid = auth.currentUser?.uid || user?.uid || (user as any)?.$id;
          const myPosts = postsData.filter(p => p.userId === currentUuid);
          setUserPostCount(myPosts.length);
      }

      // Top Nodes (Active Users) calculation
      const nodeMap: Record<string, {name: string, score: number, img: string}> = {};
      postsData.forEach(p => {
          if (!nodeMap[p.userId]) {
              nodeMap[p.userId] = { name: p.authorName, score: 0, img: p.authorAvatar };
          }
          nodeMap[p.userId].score += 1; // +1 score per post
      });
      const sortedNodes = Object.values(nodeMap).sort((a, b) => b.score - a.score).slice(0, 3);
      setTopNodes(sortedNodes);

      // Trending Hashtags Calculation
      const tagMap: Record<string, number> = {};
      postsData.forEach(p => {
          if (!p.content) return;
          const tags = p.content.match(/#[a-zA-Z0-9_]+/g);
          if (tags) {
              tags.forEach(tag => {
                  tagMap[tag] = (tagMap[tag] || 0) + 1;
              });
          }
      });
      const sortedTags = Object.entries(tagMap)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
      setTrendingTags(sortedTags);

      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const injectCodeBlock = () => {
      setContent(prev => prev + '\n```\n// Your code here\n```\n');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !auth.currentUser) return;
    if (!content.trim() && !imageFile) return;

    setIsPublishing(true);
    try {
      let imageUrl = '';
      if (imageFile) {
          imageUrl = await uploadImageToCloudinary(imageFile);
      }
      
      const currentUserId = auth.currentUser?.uid || user?.uid || (user as any)?.$id || 'anonymous';
      const authorName = profile?.username || auth.currentUser?.displayName || 'User';
      const authorAvatar = profile?.avatar_url || auth.currentUser?.photoURL || '';

      await addDoc(collection(db, 'posts'), {
        content: content.trim(),
        imageUrl,
        userId: currentUserId,
        authorName,
        authorAvatar,
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });

      setContent('');
      removeImage();
    } catch (err) {
      console.error("Error publishing post:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Layout>
      {/* 
        Background: Neredeyse tam siyah, 
        Geometrik grid deseni overlay 
      */}
      <div className="min-h-screen bg-[#050505] pt-24 pb-12 font-sans text-gray-100 relative">
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8">
            
            {/* L E F T   C O L U M N   ( PROFILE / STATS ) */}
            <div className="hidden lg:block space-y-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-6">
               {(user || auth.currentUser) && (
                <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-24 bg-gradient-to-br from-fuchsia-600 to-cyan-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/stardust.png')] opacity-30" />
                    </div>
                    <div className="px-5 pb-5 relative">
                        {/* Avatar Layered correctly over gradient */}
                        <div className="relative -mt-12 ml-4 w-16 h-16 rounded-xl bg-black border-4 border-gray-900 overflow-hidden flex items-center justify-center shadow-lg">
                            {profile?.avatar_url || auth.currentUser?.photoURL ? (
                                <img src={profile?.avatar_url || auth.currentUser?.photoURL || ''} alt="You" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-black text-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                                {(profile?.username || auth.currentUser?.displayName || 'U')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Text Content completely BELOW avatar */}
                        <div className="mt-3 ml-4 flex flex-col">
                            <h2 className="text-xl font-black text-white tracking-tight leading-none">
                                {profile?.username || auth.currentUser?.displayName || 'Developer'}
                            </h2>
                            <p className="text-gray-400 text-sm font-mono mt-1">@root_user</p>
                        </div>

                        <div className="h-px bg-white/5 my-4 mx-4" />

                        <div className="space-y-4 px-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Snippets Injected</span>
                                <span className="text-cyan-400 font-mono font-bold">
                                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : userPostCount}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Network Rank</span>
                                <span className="text-fuchsia-400 font-mono font-bold">#4</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                           <Link to="/profile" className="text-[11px] uppercase tracking-widest font-black text-gray-500 hover:text-white transition-colors">
                             View Configs
                           </Link>
                        </div>
                    </div>
                </div>
               )}

               {/* Navigation Extracted / Extra links */}
               <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-4 space-y-2">
                   {['Global Feed', 'Following', 'Bookmarked', 'Tech Labs'].map((item, idx) => (
                       <button key={item} className={cn(
                           "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold",
                           idx === 0 ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                       )}>
                           {idx === 0 && <Hash className="w-4 h-4 text-cyan-400" />}
                           {idx === 1 && <Heart className="w-4 h-4" />}
                           {idx === 2 && <Bookmark className="w-4 h-4" />}
                           {idx === 3 && <Activity className="w-4 h-4" />}
                           {item}
                       </button>
                   ))}
               </div>
            </div>

            {/* C E N T E R   C O L U M N   ( FEED & COMPOSER ) */}
            <div className="w-full flex flex-col items-center">
              
              <div className="w-full max-w-[650px]">
                {/* 3. Dev-Composer: The Monster Box */}
                {(user || auth.currentUser) ? (
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl mb-8 p-1 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden focus-within:border-cyan-500/50 transition-colors duration-500">
                    <div className="bg-[#0c0c0c] rounded-[22px] p-5">
                        <form onSubmit={handlePublish} className="flex flex-col gap-3">
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-800 hidden sm:block">
                                    {profile?.avatar_url || auth.currentUser?.photoURL ? (
                                        <img src={profile?.avatar_url || auth.currentUser?.photoURL || ''} alt="You" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                                            {(profile?.username || auth.currentUser?.displayName || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Execute a public string into the network..."
                                    className="w-full bg-transparent border-none text-white text-[15px] placeholder:text-gray-600 focus:outline-none resize-none min-h-[70px] font-sans"
                                    rows={content.split('\n').length > 3 ? content.split('\n').length : 3}
                                />
                            </div>

                            {/* Image Preview */}
                            <AnimatePresence>
                                {imagePreview && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className="relative rounded-xl overflow-hidden border border-white/10"
                                >
                                    <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-[400px]" />
                                    <button 
                                        type="button" 
                                        onClick={removeImage}
                                        className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-rose-400 hover:text-rose-300 rounded-full transition-colors backdrop-blur-md"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="h-px bg-white/5 my-2 w-full" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 p-2 rounded-xl transition-all"
                                        title="Attach Media"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

                                    <button
                                        type="button"
                                        onClick={injectCodeBlock}
                                        className="text-gray-400 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 p-2 rounded-xl transition-all font-mono font-bold"
                                        title="Inject Code Snippet"
                                    >
                                        <Code className="w-5 h-5" />
                                    </button>
                                    
                                    <button type="button" className="text-gray-400 hover:text-green-400 hover:bg-green-400/10 p-2 rounded-xl transition-all hidden sm:block">
                                        <span className="font-bold font-mono">@</span>
                                    </button>

                                    <button type="button" className="text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 p-2 rounded-xl transition-all hidden sm:block">
                                        <Trophy className="w-5 h-5" />
                                    </button>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={isPublishing || (!content.trim() && !imageFile)}
                                    className="bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white font-black text-[13px] px-8 py-2.5 h-auto rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] border-none disabled:opacity-50 transition-all uppercase tracking-widest leading-none flex items-center gap-2"
                                >
                                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Broadcast</>}
                                </Button>
                            </div>
                        </form>
                    </div>
                    </div>
                ) : (
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-3xl p-8 mb-10 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                        <h2 className="text-2xl font-black text-white relative z-10 w-full mb-2">Welcome to the Network</h2>
                        <p className="text-gray-400 font-medium relative z-10 mb-2">Authenticate to execute strings and interact with other nodes.</p>
                        <Link to="/auth" className="relative z-10">
                            <Button className="bg-white text-black font-black px-10 border-none rounded-xl hover:bg-gray-200 uppercase tracking-widest text-[13px] h-12">Init Session</Button>
                        </Link>
                    </div>
                )}

                {/* Timeline Feed */}
                <div className="w-full">
                    {loading ? (
                        <div className="flex justify-center py-20">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-r-2 border-fuchsia-500 animate-spin opacity-50"></div>
                        </div>
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-6 w-full flex flex-col items-center">
                        {posts.map((post) => (
                            <PostItem key={post.id} post={post} />
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-[#0f0f0f] rounded-3xl border border-white/5">
                        <div className="w-20 h-20 bg-black shadow-[0_0_30px_rgba(34,211,238,0.1)] rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                            <Code className="w-10 h-10 text-cyan-500/50" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Empty Array</h3>
                        <p className="text-[14px] text-gray-500">The database is currently awaiting its first packet.</p>
                        </div>
                    )}
                </div>
              </div>

            </div>

            {/* R I G H T   C O L U M N   ( DISCOVERY / TRENDS ) */}
            <div className="hidden lg:block space-y-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-6">
              
              {/* Highlight 1 */}
              <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-5">
                  <h3 className="text-white font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-fuchsia-500" /> Top Nodes
                  </h3>
                  <div className="space-y-4">
                      {loading ? (
                          <div className="animate-pulse space-y-4">
                              <div className="h-10 bg-white/5 rounded-xl"></div>
                              <div className="h-10 bg-white/5 rounded-xl"></div>
                              <div className="h-10 bg-white/5 rounded-xl"></div>
                          </div>
                      ) : topNodes.length > 0 ? topNodes.map((u, i) => (
                           <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                        {u.img ? (
                                            <img src={u.img} alt={u.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-fuchsia-600 to-cyan-600">{u.name[0]?.toUpperCase()}</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{u.name}</p>
                                        <p className="text-[11px] text-gray-500 truncate">Network Contributor</p>
                                    </div>
                                </div>
                                <div className="text-xs font-mono font-bold text-gray-400">{u.score} pts</div>
                           </div>
                      )) : (
                          <div className="text-[12px] text-gray-500 italic">No nodes detected.</div>
                      )}
                  </div>
                  <button className="w-full mt-4 py-2 border border-white/10 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-white/5 transition-colors">
                      View Leaderboard
                  </button>
              </div>

              {/* Highlight 2 */}
              <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-5 relative overflow-hidden group">
                  <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full group-hover:bg-fuchsia-500/20 transition-colors duration-1000" />
                  <h3 className="text-white font-black uppercase tracking-tight flex items-center gap-2 mb-4 relative z-10">
                       Trending Topics
                  </h3>
                  <div className="space-y-3 relative z-10">
                      {loading ? (
                          <div className="animate-pulse space-y-3">
                              <div className="h-8 w-24 bg-white/5 rounded-md"></div>
                              <div className="h-8 w-32 bg-white/5 rounded-md"></div>
                              <div className="h-8 w-20 bg-white/5 rounded-md"></div>
                          </div>
                      ) : trendingTags.length > 0 ? trendingTags.map((t, i) => (
                           <div key={i} className="cursor-pointer group/tag w-fit">
                               <p className="text-sm font-bold text-gray-300 group-hover/tag:text-white transition-colors">{t.tag}</p>
                               <p className="text-[10px] text-gray-600 font-mono">{t.count} injections</p>
                           </div>
                      )) : (
                          <div className="text-[12px] text-gray-500 italic">No trends detected.</div>
                      )}
                  </div>
              </div>

              {/* Footer Mini */}
              <div className="px-4 text-[11px] text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                  <a href="#" className="hover:text-gray-400">Terms</a>
                  <a href="#" className="hover:text-gray-400">Privacy Policy</a>
                  <a href="#" className="hover:text-gray-400">Cookie Policy</a>
                  <a href="#" className="hover:text-gray-400">Accessibility</a>
                  <a href="#" className="hover:text-gray-400">Ads Info</a>
                  <span className="w-full mt-2">© 2026 Exezy Inc.</span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

// Minimal stub for testing Activity import missing earlier.
function Activity(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
