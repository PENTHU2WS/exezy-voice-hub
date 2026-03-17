import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import {
    ArrowLeft, Heart, Download, Trash2,
    Github, Twitter, AlertTriangle, Loader2,
    Globe, Edit, FileCode, ChevronRight
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
// import { db, storage } from '../lib/config';
// import {
//     doc, getDoc, updateDoc, deleteDoc, increment,
//     collection, addDoc, query, orderBy, onSnapshot, serverTimestamp
// } from 'firebase/firestore';
// import { ref, deleteObject } from 'firebase/storage';
import { Project, UserProfile } from '../types';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import JSZip from 'jszip';

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userAvatar: string;
    createdAt: any;
}

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
}

// Recursive File Tree Component
const FileTree = ({ nodes, depth = 0, onSelect }: { nodes: FileNode[], depth?: number, onSelect: (node: FileNode) => void }) => {
    return (
        <div>
            {nodes.sort((a, b) => a.type === 'folder' ? -1 : 1).map((node) => (
                <FileTreeNode key={node.path} node={node} depth={depth} onSelect={onSelect} />
            ))}
        </div>
    );
};

const FileTreeNode = ({ node, depth, onSelect }: { node: FileNode, depth: number, onSelect: (node: FileNode) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-[#222] text-xs transition-colors select-none rounded-md mb-0.5",
                    isOpen ? "text-yellow-400 font-medium" : "text-gray-400"
                )}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
                {node.type === 'folder' && (
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform text-gray-500", isOpen && "rotate-90 text-yellow-400")} />
                )}
                {node.type === 'file' && <FileCode className="w-3.5 h-3.5 text-blue-500" />}
                <span className="truncate">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <FileTree nodes={node.children} depth={depth + 1} onSelect={onSelect} />
            )}
        </div>
    );
};

// Helper to get color for tags
const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('react')) return 'bg-cyan-400';
    if (t.includes('vue')) return 'bg-green-500';
    if (t.includes('angular')) return 'bg-red-600';
    if (t.includes('python')) return 'bg-yellow-400';
    if (t.includes('javascript') || t === 'js') return 'bg-yellow-300';
    if (t.includes('typescript') || t === 'ts') return 'bg-blue-600';
    if (t.includes('css')) return 'bg-indigo-500';
    if (t.includes('html')) return 'bg-orange-500';
    if (t.includes('node')) return 'bg-green-600';
    if (t.includes('firebase')) return 'bg-yellow-500';
    return 'bg-purple-500'; // Default
};

export function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuthStore();

    const [project, setProject] = useState<Project | null>(null);
    const [creator, setCreator] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // File Browser State
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    // Comments System
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        // Mock fetch project
        const fetchProject = async () => {
             const mockProject = {
                 id: id,
                 title: 'Mock Project',
                 description: 'This is a mocked project for Appwrite transition.',
                 tags: ['React', 'TypeScript'],
                 views: 0,
                 likes: 0,
                 created_at: new Date().toISOString()
             } as any;
             setProject(mockProject);
             setLoading(false);
        };
        fetchProject();
    }, [id, navigate]);

    const fetchZip = async (url: string) => {
        setLoadingFiles(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const zip = await JSZip.loadAsync(blob);

            const nodes: FileNode[] = [];
            const paths: Record<string, FileNode> = {};

            zip.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;

                const parts = relativePath.split('/');
                let currentPath = '';

                parts.forEach((part, index) => {
                    const isFile = index === parts.length - 1;
                    const parentPath = currentPath;
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    if (!paths[currentPath]) {
                        const node: FileNode = {
                            name: part,
                            type: isFile ? 'file' : 'folder',
                            path: currentPath,
                            children: isFile ? undefined : []
                        };
                        paths[currentPath] = node;

                        if (index === 0) {
                            nodes.push(node);
                        } else {
                            const parent = paths[parentPath];
                            if (parent && parent.children) {
                                parent.children.push(node);
                                parent.children = [...new Set(parent.children)];
                            }
                        }
                    }
                });
            });

            setFileTree(nodes);
        } catch (error) {
            console.error("Error reading ZIP:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleFileSelect = async (node: FileNode) => {
        if (!project?.downloadUrl) return;
        setSelectedFileName(node.name);

        const isTextFile = /\.(txt|md|json|js|jsx|ts|tsx|css|html|py|java|c|cpp|h)$/i.test(node.name);

        if (isTextFile) {
            try {
                const response = await fetch(project.downloadUrl);
                const blob = await response.blob();
                const zip = await JSZip.loadAsync(blob);
                const file = zip.file(node.path);
                if (file) {
                    const content = await file.async('string');
                    setSelectedFileContent(content);
                }
            } catch (err) {
                console.error("Error reading file:", err);
                setSelectedFileContent("Error reading file content.");
            }
        } else {
            setSelectedFileContent("This file type cannot be previewed. Please download the project to view.");
        }
    };

    const handleDelete = async () => {
        if (!project || !user) return;
        const confirmed = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
        if (!confirmed) return;

        alert("Mock: Project deleted successfully.");
        navigate('/');
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !user || !id) return;
        setPostingComment(true);
        try {
            const newCmnt = {
                id: Date.now().toString(),
                text: newComment.trim(),
                userId: user.uid || 'anon',
                userName: profile?.username || user.email?.split('@')[0] || 'User',
                userAvatar: profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mock',
                createdAt: { toDate: () => new Date() }
            };
            setComments(prev => [newCmnt, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error("Comment error:", error);
        } finally {
            setPostingComment(false);
        }
    };

    const handleLivePreview = () => {
        if (project?.demoUrl) {
            window.open(project.demoUrl, '_blank');
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

    if (!project) return null;

    const isOwner = user?.uid === project.user_id;
    const downloadUrl = project.downloadUrl || project.file_url;
    const dnaTags = project.tags || [];

    return (
        <Layout>
            <div className="min-h-screen bg-black text-white pb-20">
                <div className="container mx-auto px-4 lg:px-6 py-8">
                    <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 font-medium text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Explore
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* === LEFT CONTENT (2/3) === */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* 1. HERO IMAGE CARD - Large Image with Button Overlay */}
                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[#222] bg-[#09090b] shadow-2xl group">
                                <img
                                    src={project.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80'}
                                    alt={project.title}
                                    className="w-full h-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                                />
                                {project.demoUrl && (
                                    <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <button
                                            onClick={handleLivePreview}
                                            className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <Globe className="w-4 h-4" /> Live Preview
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 2. FILE & CODE GRID - Split Bottom */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">

                                {/* FILE BROWSER (1/3) */}
                                <div className="md:col-span-1 bg-[#09090b] border border-[#222] rounded-3xl overflow-hidden flex flex-col shadow-xl">
                                    {/* Mac-like Header */}
                                    <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between bg-[#0e0e11]">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">File Browser</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                        </div>
                                    </div>

                                    {/* File Tree List */}
                                    <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                        {loadingFiles ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                                            </div>
                                        ) : fileTree.length > 0 ? (
                                            <FileTree nodes={fileTree} onSelect={handleFileSelect} />
                                        ) : (
                                            <div className="text-center text-gray-600 text-xs py-10">Empty Project</div>
                                        )}
                                    </div>
                                </div>

                                {/* CODE VIEWER (2/3) */}
                                <div className="md:col-span-2 bg-[#09090b] border border-[#222] rounded-3xl overflow-hidden flex flex-col shadow-xl">
                                    {/* Tabs Header */}
                                    <div className="flex items-center border-b border-[#222] bg-[#0e0e11]">
                                        {selectedFileName && (
                                            <div className="px-4 py-3 border-r border-[#222] bg-[#1a1a1e] border-t-2 border-t-yellow-500 text-gray-200 text-xs font-bold flex items-center gap-2">
                                                <span className="text-yellow-500 uppercase">{selectedFileName.split('.').pop()}</span>
                                                {selectedFileName}
                                            </div>
                                        )}
                                        {!selectedFileName && (
                                            <div className="px-4 py-3 text-gray-500 text-xs font-medium">No file selected</div>
                                        )}
                                    </div>

                                    {/* Editor Content */}
                                    <div className="flex-1 bg-[#0c0c0e] p-4 overflow-auto custom-scrollbar">
                                        {selectedFileContent ? (
                                            <pre className="font-mono text-xs md:text-sm text-gray-300 leading-relaxed">
                                                <code className="language-typescript">{selectedFileContent}</code>
                                            </pre>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-3 opacity-50">
                                                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1e] flex items-center justify-center">
                                                    <FileCode className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-medium">Select a file to view code</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* === RIGHT SIDEBAR (1/3) === */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* 1. AUTHOR CARD */}
                            {creator && (
                                <Link to={`/profile/${creator.id}`} className="block group">
                                    <div className="bg-[#09090b] border border-[#222] rounded-3xl p-6 shadow-xl hover:border-purple-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative">
                                                <img
                                                    src={creator.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                    alt={creator.username}
                                                    className="w-16 h-16 rounded-full border-2 border-purple-600/50 shadow-lg shadow-purple-900/20"
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#09090b]"></div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg leading-tight">{creator.username}</h3>
                                                <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-wide border border-purple-500/20">
                                                    Creator
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-xs leading-relaxed mb-6 line-clamp-2">
                                            {creator.bio || 'Passionate developer building awesome tools for the open source community.'}
                                        </p>
                                        <div className="flex gap-4 border-t border-[#222] pt-4">
                                            <Github className="w-5 h-5 text-gray-500 hover:text-white transition-colors cursor-pointer" />
                                            <Twitter className="w-5 h-5 text-gray-500 hover:text-blue-400 transition-colors cursor-pointer" />
                                            <Heart className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors cursor-pointer" />
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {/* 2. MANAGEMENT CARD */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-6 shadow-xl space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                    <Edit className="w-4 h-4 text-gray-500" /> Management
                                </h4>

                                {isOwner && (
                                    <>
                                        <Link to={`/project/edit/${project.id}`} className="block">
                                            <Button className="w-full bg-transparent hover:bg-[#151518] text-gray-300 border border-[#333] rounded-xl h-11 flex items-center justify-center gap-2 font-medium transition-all group">
                                                <Edit className="w-4 h-4 group-hover:text-white" /> Edit Project
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={handleDelete}
                                            className="w-full bg-transparent hover:bg-red-950/20 text-red-500 border border-red-900/30 rounded-xl h-11 flex items-center justify-center gap-2 font-medium transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </Button>
                                    </>
                                )}

                                {downloadUrl ? (
                                    <a href={downloadUrl} download target="_self" className="block">
                                        <Button className="w-full bg-white hover:bg-gray-200 text-black border-none rounded-xl h-11 flex items-center justify-center gap-2 font-bold shadow-lg shadow-white/5 transition-all active:scale-95">
                                            <Download className="w-4 h-4" /> Download ZIP
                                        </Button>
                                    </a>
                                ) : (
                                    <Button disabled className="w-full bg-[#151518] border border-[#333] text-gray-600 rounded-xl h-11">
                                        Download Unavailable
                                    </Button>
                                )}
                            </div>

                            {/* 3. LANGUAGE DNA */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-300">Language DNA</h4>
                                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="h-2.5 w-full bg-[#1a1a1e] rounded-full overflow-hidden flex mb-4">
                                    {dnaTags.length > 0 ? (
                                        dnaTags.map((tag, i) => (
                                            <div
                                                key={i}
                                                className={`h-full ${getTagColor(tag)}`}
                                                style={{ width: `${100 / dnaTags.length}%` }}
                                            />
                                        ))
                                    ) : (
                                        <div className="h-full bg-gray-800 w-full"></div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                    {dnaTags.map((tag, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                            <div className={`w-2 h-2 rounded-full ${getTagColor(tag)}`}></div>
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. COMMENTS */}
                            <div className="bg-[#09090b] border border-[#222] rounded-3xl p-6 shadow-xl">
                                <h4 className="text-sm font-bold text-gray-300 mb-4">Comments</h4>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar mb-4 pr-1">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-6 text-gray-600 text-xs">No comments yer.</div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-3">
                                                <Link to={`/profile/${comment.userId}`} className="shrink-0">
                                                    <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-gray-800" />
                                                </Link>
                                                <div>
                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                        <span className="text-xs font-bold text-gray-300">{comment.userName}</span>
                                                        <span className="text-[10px] text-gray-600">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {user ? (
                                    <div className="relative">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add text comment..."
                                            className="w-full bg-[#151518] border border-[#333] rounded-xl p-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40 resize-none h-20 pr-12"
                                        />
                                        <button
                                            onClick={handlePostComment}
                                            disabled={postingComment || !newComment.trim()}
                                            className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {postingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Post'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-[#151518] rounded-xl p-3 text-center">
                                        <Link to="/auth" className="text-xs text-purple-400 hover:text-white transition-colors">Sign in to comment</Link>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
