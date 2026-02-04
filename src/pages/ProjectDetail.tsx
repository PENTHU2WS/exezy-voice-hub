import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { FileTree, FileNode } from '../components/features/FileTree';
import { CodeViewer } from '../components/features/CodeViewer';
import { LanguageStats } from '../components/features/LanguageStats';
import { Button } from '../components/common/Button';
import {
    ArrowLeft, Heart, Edit2, Loader2,
    User as UserIcon, Download, Share2, X, MessageSquare
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Project, UserProfile } from '../types';
import { useAuthStore } from '../store/authStore';
import JSZip from 'jszip';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [creator, setCreator] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({ projects: 0, followers: 0 });
    const [isFollowing, setIsFollowing] = useState(false);

    // File Browser State
    const [files, setFiles] = useState<FileNode[]>([]);
    const [zipInstance, setZipInstance] = useState<JSZip | null>(null);
    const [selectedCode, setSelectedCode] = useState('// Select a file to view code');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFilename, setSelectedFilename] = useState('Explorer');
    const [selectedLanguage, setSelectedLanguage] = useState('tsx');
    const [readingFile, setReadingFile] = useState(false);

    // State for ZIP analysis
    const [analysis, setAnalysis] = useState<{
        totalSize: number;
        fileCount: number;
        languages: { name: string; percent: number; color: string; }[];
        isAnalyzing: boolean;
    }>({
        totalSize: 0,
        fileCount: 0,
        languages: [],
        isAnalyzing: true
    });

    // Likes State
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    // Comments & Social
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});

    // Share & Preview State
    const [showShareSuccess, setShowShareSuccess] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const { user, addXp } = useAuthStore();

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch Project
                const { data: projectData, error: projectError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (projectError) throw projectError;
                setProject(projectData as Project);
                setLikesCount(projectData.likes || 0);

                // Fetch Comments
                const { data: commentData } = await supabase
                    .from('comments')
                    .select('*, profiles!comments_user_id_fkey ( username, avatar_url )')
                    .eq('project_id', id)
                    .order('created_at', { ascending: false });
                setComments(commentData || []);

                // Fetch Creator and Real Stats
                if (projectData?.user_id) {
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', projectData.user_id)
                        .single();
                    setCreator(userData as UserProfile);

                    // Real Statistics: Project Count
                    const { count: pCount } = await supabase
                        .from('projects')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', projectData.user_id);

                    // Real Statistics: Follower Count
                    const { count: fCount } = await supabase
                        .from('follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', projectData.user_id);

                    setStats({
                        projects: pCount || 0,
                        followers: fCount || 0
                    });

                    if (user) {
                        // Check if Liked (Persistent)
                        try {
                            const { data: rpcStatus, error: rpcError } = await supabase
                                .rpc('get_like_status', { p_id: parseInt(id) });

                            if (!rpcError) {
                                setIsLiked(!!rpcStatus);
                            } else {
                                throw rpcError;
                            }
                        } catch (err) {
                            // Fallback to manual check
                            const { data: likeData } = await supabase
                                .from('project_likes')
                                .select('user_id')
                                .eq('project_id', id)
                                .eq('user_id', user.id)
                                .single();
                            setIsLiked(!!likeData);
                        }

                        // Check if Following
                        const { data: followData } = await supabase
                            .from('follows')
                            .select('*')
                            .eq('follower_id', user.id)
                            .eq('following_id', projectData.user_id)
                            .single();
                        setIsFollowing(!!followData);

                        // Check Comment Likes
                        const { data: cLikes } = await supabase
                            .from('comment_likes')
                            .select('comment_id')
                            .eq('user_id', user.id);

                        const likesMap: Record<string, boolean> = {};
                        cLikes?.forEach(l => likesMap[l.comment_id] = true);
                        setCommentLikes(likesMap);
                    }
                }

                // Load ZIP Content
                if (projectData.file_url) {
                    await loadProjectFiles(projectData.file_url);
                }

            } catch (err) {
                console.error("Project Load Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        // Virtual Navigation Listener
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NAVIGATE' && event.data?.path) {
                handleRun(event.data.path);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [id, user?.id]);

    async function loadProjectFiles(url: string) {
        setAnalysis(prev => ({ ...prev, isAnalyzing: true }));
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const zip = new JSZip();
            const content = await zip.loadAsync(blob);
            setZipInstance(content);

            const fileNodes: FileNode[] = [];
            const folderMap: Record<string, FileNode> = {};
            const entries = Object.entries(content.files);
            entries.sort((a, b) => a[0].localeCompare(b[0]));

            // Analysis variables
            let totalUncompressedSize = 0;
            let totalFileCount = 0;
            let totalCodeSize = 0;
            const extensionStats: Record<string, number> = {};

            const CODE_EXTENSIONS = new Set([
                'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py',
                'java', 'php', 'rb', 'go', 'rs', 'c', 'cpp', 'cs'
            ]);

            const languageMap: Record<string, { name: string; color: string }> = {
                'ts': { name: 'TypeScript', color: '#3178c6' },
                'tsx': { name: 'TypeScript', color: '#3178c6' },
                'js': { name: 'JavaScript', color: '#f7df1e' },
                'jsx': { name: 'JavaScript', color: '#f7df1e' },
                'html': { name: 'HTML', color: '#e34c26' },
                'css': { name: 'CSS', color: '#563d7c' },
                'py': { name: 'Python', color: '#3572A5' },
                'php': { name: 'PHP', color: '#4F5D95' },
                'rb': { name: 'Ruby', color: '#701516' },
                'go': { name: 'Go', color: '#00ADD8' },
                'rs': { name: 'Rust', color: '#dea584' },
                'java': { name: 'Java', color: '#b07219' },
                'cpp': { name: 'C++', color: '#f34b7d' },
                'c': { name: 'C', color: '#555555' },
                'cs': { name: 'C#', color: '#178600' },
            };

            for (const [path, file] of entries) {
                if (path.includes('node_modules') || path.includes('.git') || path.includes('__MACOSX')) continue;

                if (!file.dir) {
                    totalFileCount++;
                    // @ts-ignore - uncompressedSize exists in jszip internal file object
                    const fileSize = file._data?.uncompressedSize || 0;
                    totalUncompressedSize += fileSize;

                    const ext = path.split('.').pop()?.toLowerCase() || '';

                    // GitHub Style: Only include code files in DNA DNA
                    if (CODE_EXTENSIONS.has(ext)) {
                        totalCodeSize += fileSize;
                        extensionStats[ext] = (extensionStats[ext] || 0) + fileSize;
                    }
                }

                const parts = path.split('/').filter(p => p.length > 0);
                let currentPath = '';

                parts.forEach((part, index) => {
                    const isLast = index === parts.length - 1;
                    const fullPath = currentPath + part + (isLast && !file.dir ? '' : '/');

                    if (!folderMap[fullPath]) {
                        const node: FileNode = {
                            name: part,
                            type: (isLast && !file.dir) ? 'file' : 'folder',
                            path: fullPath,
                            children: []
                        };

                        if (index === 0) {
                            fileNodes.push(node);
                        } else {
                            folderMap[currentPath].children?.push(node);
                        }
                        folderMap[fullPath] = node;
                    }
                    currentPath = fullPath;
                });
            }

            // Process analysis based on totalCodeSize
            const langStats = Object.entries(extensionStats)
                .map(([ext, size]) => {
                    const info = languageMap[ext] || { name: 'Other Code', color: '#a0a0a0' };
                    return {
                        name: info.name,
                        size,
                        color: info.color
                    };
                })
                .reduce((acc, curr) => {
                    const existing = acc.find(a => a.name === curr.name);
                    if (existing) {
                        existing.size += curr.size;
                    } else {
                        acc.push(curr);
                    }
                    return acc;
                }, [] as { name: string; size: number; color: string }[])
                .sort((a, b) => b.size - a.size);

            const topLangs = langStats.slice(0, 4);
            const others = langStats.slice(4);

            if (others.length > 0) {
                const otherSize = others.reduce((sum, l) => sum + l.size, 0);
                topLangs.push({
                    name: 'Other',
                    size: otherSize,
                    color: '#a0a0a0'
                });
            }

            const finalLangs = topLangs.map(l => ({
                name: l.name,
                percent: totalCodeSize > 0 ? Math.round((l.size / totalCodeSize) * 100) : 0,
                color: l.color
            })).filter(l => l.percent > 0);

            // Handle edge case where distribution doesn't add up to 100 due to rounding
            if (finalLangs.length > 0) {
                const totalPercent = finalLangs.reduce((sum, l) => sum + l.percent, 0);
                if (totalPercent > 0 && totalPercent !== 100) {
                    finalLangs[0].percent += (100 - totalPercent);
                }
            }

            setAnalysis({
                totalSize: totalUncompressedSize,
                fileCount: totalFileCount,
                languages: finalLangs,
                isAnalyzing: false
            });

            setFiles(fileNodes);
        } catch (err) {
            console.error("ZIP Load Error:", err);
            setAnalysis(prev => ({ ...prev, isAnalyzing: false, languages: [] }));
        }
    }

    const handleFileClick = async (file: FileNode) => {
        if (file.type === 'file' && zipInstance && file.path) {
            setReadingFile(true);
            try {
                const zipFile = zipInstance.file(file.path);
                if (!zipFile) return;

                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);

                if (isImage) {
                    const blob = await zipFile.async('blob');
                    const url = URL.createObjectURL(blob);

                    // Cleanup previous URL if exists
                    if (selectedImage) URL.revokeObjectURL(selectedImage);

                    setSelectedImage(url);
                    setSelectedCode('');
                    setSelectedFilename(file.name);
                } else {
                    const content = await zipFile.async('string');
                    setSelectedCode(content || '// Empty file');
                    setSelectedImage(null);
                    setSelectedFilename(file.name);
                    setSelectedLanguage(getLanguageFromExt(ext));
                }
            } catch (err) {
                console.error("File Read Error:", err);
                setSelectedCode('// Error reading file content');
            } finally {
                setReadingFile(false);
            }
        }
    };

    const getLanguageFromExt = (ext: string): string => {
        const map: Record<string, string> = {
            'js': 'javascript', 'jsx': 'tsx', 'ts': 'typescript', 'tsx': 'tsx',
            'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown'
        };
        return map[ext] || 'javascript';
    };

    const handleLike = async () => {
        if (!user || !id) return alert("Please Login!");

        const previousIsLiked = isLiked;
        const newIsLiked = !previousIsLiked;

        // Optimistic UI Update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                // LIKE: Insert record and increment counter
                const { error: insertError } = await supabase
                    .from('project_likes')
                    .insert({ project_id: id, user_id: user.id });

                if (insertError) throw insertError;

                await supabase.rpc('increment_likes', { project_id: parseInt(id) });
            } else {
                // UNLIKE: Delete record and decrement counter
                const { error: deleteError } = await supabase
                    .from('project_likes')
                    .delete()
                    .eq('project_id', id)
                    .eq('user_id', user.id);

                if (deleteError) throw deleteError;

                await supabase.rpc('decrement_likes', { project_id: parseInt(id) });
            }
        } catch (err: any) {
            console.error("Like Action Error:", err);
            // Revert on failure
            setIsLiked(previousIsLiked);
            setLikesCount(prev => previousIsLiked ? prev + 1 : prev - 1);
        }
    };

    const handleFollow = async () => {
        if (!user || !creator) return alert("Please Login!");

        const myId = user.id;
        const targetId = creator.id;

        try {
            if (isFollowing) {
                // UNFOLLOW
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', myId)
                    .eq('following_id', targetId);

                if (error) throw error;
                setIsFollowing(false);
                setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
            } else {
                // FOLLOW
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: myId, following_id: targetId });

                if (error) throw error;

                // Send Notification
                await supabase.from('notifications').insert({
                    user_id: targetId,
                    type: 'follow',
                    message: `${user.user_metadata?.username || 'Some user'} started following you!`
                });

                setIsFollowing(true);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
        } catch (err: any) {
            alert("Follow Error: " + err.message);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShowShareSuccess(true);
            setTimeout(() => setShowShareSuccess(false), 3000);
        } catch (err) {
            alert("Failed to copy link.");
        }
    };

    const handleRun = async (entryFile: string = 'index.html') => {
        if (!zipInstance) return alert("Project files are still being processed...");

        // Smart Search: Handle relative paths (e.g., ./about.html -> about.html)
        const cleanPath = entryFile.replace(/^\.\//, '');

        // Find exact file or case-insensitive match
        const fileEntry = Object.values(zipInstance.files).find(
            file => !file.dir && (
                file.name === cleanPath ||
                file.name.toLowerCase().endsWith(cleanPath.toLowerCase())
            )
        );

        if (!fileEntry && entryFile === 'index.html') {
            // Fallback for initial run: find *any* index.html
            const anyIndex = Object.values(zipInstance.files).find(
                file => !file.dir && file.name.toLowerCase().endsWith('index.html')
            );
            if (!anyIndex) return alert('Bu projede çalıştırılacak bir index.html bulunamadı!');
            return handleRun(anyIndex.name);
        }

        if (!fileEntry) return alert(`File not found: ${entryFile}`);

        try {
            let content = await fileEntry.async('string');

            // Detect Build Tools
            if (content.match(/src=["']\/src\/main\.(tsx|jsx|ts|js)["']/) || content.includes('vite') || content.includes('react-dom')) {
                return alert('⚠️ Bu bir React/Vite Kaynak Kodudur.\n\nTarayıcıda çalışması için "Build" edilmesi gerekir.\nŞu an sadece saf HTML/JS/CSS projeleri çalıştırılabilir.');
            }

            // --- INLINE LINKER LOGIC ---
            // 1. Inject CSS
            const cssMatches = content.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/g);
            for (const match of cssMatches) {
                const cssPath = match[1];
                const cssFile = Object.values(zipInstance.files).find(f => f.name.endsWith(cssPath));
                if (cssFile) {
                    const cssContent = await cssFile.async('string');
                    content = content.replace(match[0], `<style>/* Injected from ${cssPath} */\n${cssContent}</style>`);
                }
            }

            // 2. Inject JS
            const jsMatches = content.matchAll(/<script[^>]+src=["']([^"']+\.js)["'][^>]*><\/script>/g);
            for (const match of jsMatches) {
                const jsPath = match[1];
                const jsFile = Object.values(zipInstance.files).find(f => f.name.endsWith(jsPath));
                if (jsFile) {
                    const jsContent = await jsFile.async('string');
                    content = content.replace(match[0], `<script>/* Injected from ${jsPath} */\n${jsContent}</script>`);
                }
            }

            // 3. Inject Virtual Navigation Script
            const navScript = `
                <script>
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a');
                        if (link) {
                            const href = link.getAttribute('href');
                            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                                e.preventDefault();
                                window.parent.postMessage({ type: 'NAVIGATE', path: href }, '*');
                            }
                        }
                    });
                </script>
            `;
            content = content + navScript;

            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            // Cleanup old blob if switching pages within modal
            if (previewContent && previewContent.startsWith('blob:')) {
                URL.revokeObjectURL(previewContent);
            }

            setPreviewContent(url);
            setIsPreviewOpen(true);
        } catch (err) {
            console.error("Preview Error:", err);
            alert("Failed to render file.");
        }
    };

    const closePreview = () => {
        setIsPreviewOpen(false);
        if (previewContent && previewContent.startsWith('blob:')) {
            URL.revokeObjectURL(previewContent);
            setPreviewContent('');
        }
    };

    const handleCommentSubmit = async (parentId: string | null = null) => {
        const text = commentText.trim();
        if (!user || !id || !text) return;
        setIsPostingComment(true);
        try {
            const { data: newComment, error } = await supabase
                .from('comments')
                .insert({
                    project_id: id,
                    user_id: user.id,
                    content: text,
                    parent_id: parentId
                })
                .select('*, profiles!comments_user_id_fkey ( username, avatar_url )')
                .single();
            if (error) throw error;

            // For UI simplicity, we refetch or just add to top
            if (parentId) {
                // For replies, it's easier to just refresh comments for now to get correct threading
                const { data: freshComments } = await supabase
                    .from('comments')
                    .select('*, profiles!comments_user_id_fkey ( username, avatar_url )')
                    .eq('project_id', id)
                    .order('created_at', { ascending: false });
                setComments(freshComments || []);
            } else {
                setComments(prev => [newComment, ...prev]);
            }

            setCommentText('');
            setReplyingTo(null);
            await addXp(15);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleCommentLike = async (commentId: string) => {
        if (!user) return alert("Please Login!");

        const isLiked = !!commentLikes[commentId];
        const newLikes = { ...commentLikes, [commentId]: !isLiked };
        setCommentLikes(newLikes);

        try {
            if (isLiked) {
                await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
            } else {
                await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
            }
        } catch (err) {
            setCommentLikes(commentLikes); // Revert
        }
    };

    // Helper to render nested comments
    const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => {
        const isLiked = !!commentLikes[comment.id];
        const replies = comments.filter(c => c.parent_id === comment.id);

        const profile = comment.profiles;

        return (
            <div className={cn("space-y-4", depth > 0 && "ml-8 mt-4 pl-4 border-l border-purple-500/10")}>
                <div className="flex gap-4 group">
                    <Link to={`/profile/${profile?.id}`} className="flex-shrink-0">
                        <div className={cn(
                            "rounded-full border border-white/5 p-0.5 hover:border-purple-500/50 transition-colors",
                            depth > 0 ? "w-8 h-8" : "w-10 h-10"
                        )}>
                            <img
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </Link>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Link to={`/profile/${profile?.id}`} className="font-bold text-white hover:text-purple-400 transition-colors text-xs">
                                {profile?.username}
                            </Link>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                        </div>
                        <div className={cn(
                            "p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed max-w-[90%] shadow-lg",
                            depth > 0 && "text-xs p-3"
                        )}>
                            {comment.content}
                        </div>
                        <div className="flex items-center gap-4 pt-1">
                            <button
                                onClick={() => handleCommentLike(comment.id)}
                                className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors", isLiked ? "text-red-500" : "text-gray-600 hover:text-red-400")}
                            >
                                <Heart className={cn("w-3 h-3", isLiked && "fill-current")} /> Like
                            </button>
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="flex items-center gap-1 text-[10px] font-black text-gray-600 hover:text-purple-400 uppercase tracking-widest transition-colors"
                            >
                                <MessageSquare className="w-3 h-3" /> Reply
                            </button>
                        </div>

                        {replyingTo === comment.id && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="pt-4 flex gap-2">
                                <input
                                    className="flex-1 bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500/50"
                                    placeholder="Write a reply..."
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    autoFocus
                                />
                                <Button size="sm" onClick={() => handleCommentSubmit(comment.id)} className="h-8 px-4 text-[10px] uppercase font-black">Send</Button>
                            </motion.div>
                        )}
                    </div>
                </div>
                {replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
            </div>
        );
    };

    if (loading) return (
        <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <p className="text-purple-400 font-mono text-sm animate-pulse tracking-widest uppercase">Syncing Cloud...</p>
            </div>
        </Layout>
    );

    if (!project) return (
        <Layout>
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
                <Link to="/explore"><Button variant="outline">Back to Explore</Button></Link>
            </div>
        </Layout>
    );

    const isOwner = user?.id === project.user_id;

    return (
        <Layout>
            <div className="min-h-screen bg-black">
                <div className="container mx-auto px-4 py-8">

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/explore" className="flex items-center gap-2 text-gray-500 hover:text-purple-400 transition-all group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-widest">Return to Network</span>
                        </Link>

                        <div className="flex items-center gap-3 relative">
                            <AnimatePresence>
                                {showShareSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute -top-12 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl z-50 whitespace-nowrap"
                                    >
                                        Link Kopyalandı! 🔗
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Button
                                onClick={handleShare}
                                variant="outline" size="sm" className="bg-white/5 border-purple-500/20 hover:border-purple-500/40 text-xs px-4"
                            >
                                <Share2 className="w-3.5 h-3.5 mr-2" /> Share Project
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* MAIN CONTENT (LEFT) */}
                        <div className="lg:col-span-8 flex flex-col gap-10">

                            {/* Project Visual */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative aspect-video rounded-3xl overflow-hidden border border-purple-500/20 group shadow-2xl shadow-purple-500/5"
                            >
                                <img src={project.image_url} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                                <button
                                    onClick={handleLike}
                                    className={cn(
                                        "absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md border transition-all duration-300 transform active:scale-95 group/heart flex flex-col items-center gap-1",
                                        isLiked ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-black/40 border-white/10 text-white hover:border-red-500/50"
                                    )}
                                >
                                    <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                                    <span className="text-[10px] font-black">{likesCount}</span>
                                </button>
                            </motion.div>

                            {/* Info Section */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h1 className="text-5xl font-black text-white tracking-tighter leading-none">{project.title}</h1>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {project.tags?.map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-400 text-lg leading-relaxed font-light">
                                    {project.description}
                                </p>
                            </div>

                            {/* Workstation (File Explorer) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-8 h-px bg-purple-500/30" />
                                        Workstation
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => window.open(project.file_url, '_blank')}
                                            className="h-10 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black gap-2 px-6"
                                        >
                                            <Download className="w-4 h-4" /> Export ZIP
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[650px] rounded-3xl border border-purple-500/20 bg-[#0a0a0a] overflow-hidden shadow-2xl">
                                    {/* Sidebar */}
                                    <div className="md:col-span-4 border-r border-purple-500/10 bg-black/40 backdrop-blur-xl">
                                        <FileTree files={files} onFileClick={handleFileClick} />
                                    </div>
                                    {/* Display Area */}
                                    <div className="md:col-span-8 flex flex-col bg-[#111] relative">
                                        {readingFile ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-black/80 z-10">
                                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                                <span className="text-[10px] text-purple-400 uppercase tracking-[0.2em]">Reading Stream...</span>
                                            </div>
                                        ) : selectedImage ? (
                                            <div className="flex-1 flex items-center justify-center p-8 bg-[#050505] overflow-auto">
                                                <motion.img
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    src={selectedImage}
                                                    alt={selectedFilename}
                                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5"
                                                />
                                            </div>
                                        ) : (
                                            <CodeViewer
                                                code={selectedCode}
                                                language={selectedLanguage}
                                                filename={selectedFilename}
                                                onRun={() => handleRun()}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Feed Section (Comments) */}
                            <div className="space-y-8 pt-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight">Collaboration Feed</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
                                </div>

                                {/* Send Message Box */}
                                <div className="flex gap-4 p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 focus-within:border-purple-500/30 transition-all">
                                    <div className="w-10 h-10 rounded-full border border-purple-500/30 flex-shrink-0 p-0.5 overflow-hidden">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" />
                                        ) : <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center"><UserIcon className="w-4 h-4 text-gray-600" /></div>}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <textarea
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Join the discussion..."
                                            className="w-full bg-transparent text-white border-none outline-none resize-none min-h-[80px] font-medium placeholder:text-gray-600"
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={() => handleCommentSubmit()}
                                                disabled={isPostingComment || !commentText.trim()}
                                                isLoading={isPostingComment}
                                                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 h-9 px-6 rounded-xl text-xs"
                                            >
                                                Send Update
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div className="space-y-10">
                                    <div className="flex flex-col gap-8">
                                        {comments.filter(c => !c.parent_id).map((comment) => (
                                            <CommentItem key={comment.id} comment={comment} />
                                        ))}
                                    </div>
                                    {comments.length === 0 && (
                                        <div className="text-center py-10 opacity-30 italic text-sm text-gray-500">No signals transmitted in this sector.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR (RIGHT) */}
                        <div className="lg:col-span-4 flex flex-col gap-8">

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="sticky top-8 space-y-6"
                            >
                                {/* Creator Hub */}
                                <div className="p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-purple-500/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full group-hover:bg-purple-600/20 transition-all duration-500" />

                                    <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                        <Link to={`/profile/${creator?.id}`} className="block relative">
                                            <div className="w-28 h-28 rounded-full border-2 border-purple-500/40 p-1.5 transition-transform group-hover:scale-105 duration-500">
                                                <img src={creator?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator?.username}`} className="w-full h-full rounded-full object-cover shadow-2xl" />
                                            </div>
                                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-[#0a0a0a] rounded-full" />
                                        </Link>

                                        <div className="space-y-1">
                                            <Link to={`/profile/${creator?.id}`} className="text-2xl font-black text-white hover:text-purple-400 transition-colors uppercase tracking-tighter">
                                                {creator?.full_name || creator?.username || 'Project Lead'}
                                            </Link>
                                            <p className="text-xs font-black text-purple-500 uppercase tracking-[0.2em]">@{creator?.username || 'user'}</p>
                                        </div>

                                        <p className="text-sm text-gray-500 italic leading-snug">"{creator?.bio || "Decrypting the digital logic."}"</p>

                                        {/* Real-time Statistics */}
                                        <div className="flex w-full gap-2">
                                            <div className="flex-1 p-4 rounded-3xl bg-white/5 border border-white/5">
                                                <span className="block text-2xl font-black text-white">{stats.projects}</span>
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Builds</span>
                                            </div>
                                            <div className="flex-1 p-4 rounded-3xl bg-white/5 border border-white/5">
                                                <span className="block text-2xl font-black text-white">{stats.followers}</span>
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Followers</span>
                                            </div>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <Button
                                                onClick={handleFollow}
                                                className={cn(
                                                    "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all",
                                                    isFollowing
                                                        ? "bg-white/5 text-white border border-white/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40"
                                                        : "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                                                )}
                                            >
                                                {isFollowing ? 'Disconnect (Unfollow)' : 'Follow Creator'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Architect Panel (Owner Only) */}
                                <AnimatePresence>
                                    {isOwner && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 overflow-hidden space-y-4">
                                            <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                                <Edit2 className="w-3 h-3" /> Architect Panel
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button className="bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-black h-10 px-0">Update Code</Button>
                                                <Button className="bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-red-400 text-[11px] font-black h-10 px-0">Deconstruct</Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <LanguageStats
                                    isAnalyzing={analysis.isAnalyzing}
                                    stats={analysis.languages}
                                />

                                {/* Meta Data */}
                                <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Metadata Hash</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 uppercase font-black">Initial Build</span>
                                            <span className="text-white font-mono">{new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 uppercase font-black">Visibility</span>
                                            <span className="text-white font-mono uppercase">Public</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 uppercase font-black">Traffic</span>
                                            <span className="text-white font-mono">{project.views || 0} Views</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 uppercase font-black">Total Size</span>
                                            <span className="text-white font-mono">
                                                {analysis.totalSize > 1024 * 1024
                                                    ? `${(analysis.totalSize / (1024 * 1024)).toFixed(1)} MB`
                                                    : `${(analysis.totalSize / 1024).toFixed(1)} KB`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-500 uppercase font-black">File Count</span>
                                            <span className="text-white font-mono">{analysis.fileCount} Files</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full h-full max-w-6xl bg-[#0a0a0a] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col relative shadow-2xl"
                        >
                            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-black text-white uppercase tracking-widest">Live Runtime Preview</span>
                                </div>
                                <button
                                    onClick={closePreview}
                                    className="p-3 rounded-full hover:bg-white/5 transition-colors group"
                                >
                                    <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                            <div className="flex-1 bg-white relative">
                                <iframe
                                    className="w-full h-full border-none bg-white"
                                    title="Preview"
                                    src={previewContent}
                                    sandbox="allow-scripts allow-forms allow-modals"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}
