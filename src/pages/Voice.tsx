import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { 
    Mic, MicOff, Headphones, Monitor, PhoneOff, 
    Hash, Volume2, Settings, Shield, 
    Cpu, Radio, Wifi, Zap, Terminal, Code,
    Globe, Lock, Users, ChevronDown, 
    MessageSquare, Activity, Crown, Send, Link as LinkIcon
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { db } from '../lib/config';
import { 
    collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
    doc, setDoc, deleteDoc, where 
} from 'firebase/firestore';

// Mock Data for Categories and Channels structure
const SUBNETS = [
    { id: 'nexus', name: 'The Nexus', icon: Globe },
    { id: 'dev', name: 'Dev Core', icon: Code },
    { id: 'gaming', name: 'Cyber Space', icon: Cpu },
    { id: 'secure', name: 'Black Site', icon: Lock },
];

const NODES: Record<string, any[]> = {
    nexus: [
        { id: 'global-chat', name: 'global-chat', type: 'text', unread: true },
        { id: 'system-alerts', name: 'system-alerts', type: 'text', locked: true },
        { id: 'lobby', name: 'Lobby', type: 'voice', users: 12 },
        { id: 'meeting', name: 'Conference', type: 'voice', users: 4 },
    ],
    dev: [
        { id: 'frontend-reqs', name: 'frontend-reqs', type: 'text' },
        { id: 'backend-sys', name: 'backend-sys', type: 'text', unread: true },
        { id: 'pair', name: 'Pair Programming', type: 'voice', users: 2 },
        { id: 'debug', name: 'Debugging', type: 'voice', users: 3 },
    ],
    gaming: [
        { id: 'lfg', name: 'looking-for-group', type: 'text' },
        { id: 'squad-1', name: 'Squad Alpha', type: 'voice', users: 5 },
        { id: 'squad-2', name: 'Squad Beta', type: 'voice', users: 0 },
    ],
    secure: [
        { id: 'admin-logs', name: 'admin-logs', type: 'text', locked: true },
        { id: 'command', name: 'Command Center', type: 'voice', users: 1, locked: true },
    ]
};

export function Voice() {
    const { profile } = useAuthStore();
    
    // UI States
    const [activeSubnet, setActiveSubnet] = useState('dev');
    const [activeNodeId, setActiveNodeId] = useState('pair');
    
    // WebRTC & Voice States
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false); // UI purpose only right now
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    const [roomParticipants, setRoomParticipants] = useState<any[]>([]);
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
    
    // Mutable references for WebRTC
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
    
    // Dynamic Text Data States
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [networkUsers, setNetworkUsers] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived Logic
    const currentNode = NODES[activeSubnet]?.find(n => n.id === activeNodeId) || NODES[activeSubnet][0];
    const channelType = currentNode?.type || 'voice';

    // --- FIREBASE LISTENERS FOR GLOBAL NETWORK ---
    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.username || data.full_name || 'Unknown',
                    avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`,
                    role: data.role || 'member',
                    status: data.isOnline ? 'online' : (data.lastSeen ? 'idle' : 'online'), 
                };
            });
            setNetworkUsers(fetchedUsers);
        });

        return () => unsubscribe();
    }, []);

    // --- TEXT CHAT LOGIC ---
    useEffect(() => {
        if (channelType === 'text') {
            const q = query(
                collection(db, `channels/${activeNodeId}/messages`),
                orderBy('createdAt', 'asc')
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(fetchedMessages);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            });

            return () => unsubscribe();
        }
    }, [activeNodeId, channelType]);

    // --- NATIVE WebRTC SIGNALING (MESH NETWORK) ---
    useEffect(() => {
        if (!isJoined || !profile || channelType !== 'voice') return;

        const roomId = activeNodeId;
        const myId = profile.id;

        const sendSignal = async (targetId: string, type: 'offer' | 'answer' | 'candidate', data: any) => {
            await addDoc(collection(db, `rooms/${roomId}/signals`), {
                sender: myId,
                receiver: targetId,
                type,
                data: JSON.stringify(data),
                createdAt: serverTimestamp()
            });
        };

        const createPeer = (targetId: string) => {
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    sendSignal(targetId, 'candidate', e.candidate);
                }
            };

            pc.ontrack = (e) => {
                setRemoteStreams(prev => ({ ...prev, [targetId]: e.streams[0] }));
            };

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            peersRef.current[targetId] = pc;
            return pc;
        };

        // 1. Listen to Participants in the room
        const partQuery = query(collection(db, `rooms/${roomId}/participants`));
        const unsubParts = onSnapshot(partQuery, (snapshot) => {
            const participants = snapshot.docs.map(d => d.data() as any);
            setRoomParticipants(participants.filter(p => p.id !== myId));

            participants.forEach(p => {
                if (p.id === myId) return;
                
                if (!peersRef.current[p.id]) {
                    const pc = createPeer(p.id);
                    // Base condition to avoid infinite loop of calls. The one with bigger ID sends Offer
                    if (myId > p.id) {
                        pc.createOffer()
                          .then(offer => pc.setLocalDescription(offer))
                          .then(() => sendSignal(p.id, 'offer', pc.localDescription));
                    }
                }
            });

            // Cleanup removed participants
            const currentIds = new Set(participants.map(p => p.id));
            Object.keys(peersRef.current).forEach(peerId => {
                if (!currentIds.has(peerId)) {
                    peersRef.current[peerId].close();
                    delete peersRef.current[peerId];
                    setRemoteStreams(prev => {
                        const ns = { ...prev };
                        delete ns[peerId];
                        return ns;
                    });
                }
            });
        });

        // 2. Listen to Signals aimed at myId
        const sigQuery = query(
            collection(db, `rooms/${roomId}/signals`),
            where('receiver', '==', myId)
        );
        const unsubSignals = onSnapshot(sigQuery, async (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const signal = change.doc.data();
                    const senderId = signal.sender;
                    const pc = peersRef.current[senderId];
                    const data = JSON.parse(signal.data);

                    const activePc = pc || createPeer(senderId);

                    try {
                        if (signal.type === 'offer') {
                            await activePc.setRemoteDescription(new RTCSessionDescription(data));
                            const answer = await activePc.createAnswer();
                            await activePc.setLocalDescription(answer);
                            sendSignal(senderId, 'answer', activePc.localDescription);
                            
                            if (pendingCandidatesRef.current[senderId]) {
                                pendingCandidatesRef.current[senderId].forEach(c => activePc.addIceCandidate(new RTCIceCandidate(c)));
                                delete pendingCandidatesRef.current[senderId];
                            }
                        } else if (signal.type === 'answer') {
                            await activePc.setRemoteDescription(new RTCSessionDescription(data));
                        } else if (signal.type === 'candidate') {
                            if (activePc.remoteDescription) {
                                await activePc.addIceCandidate(new RTCIceCandidate(data));
                            } else {
                                if (!pendingCandidatesRef.current[senderId]) pendingCandidatesRef.current[senderId] = [];
                                pendingCandidatesRef.current[senderId].push(data);
                            }
                        }
                    } catch (e) {
                        console.error('Signal handling error:', e);
                    }
                    
                    // Cleanup signal so it doesn't stay in Firebase forever
                    await deleteDoc(change.doc.ref).catch(() => {});
                }
            });
        });

        return () => {
            unsubParts();
            unsubSignals();
        };

    }, [isJoined, activeNodeId, profile, channelType]);


    // Handle Window Unload
    useEffect(() => {
        const handleUnload = () => { if (isJoined) leaveRoom(); };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [isJoined, activeNodeId]);

    // --- ACTIONS ---
    const joinRoom = async () => {
        if (!profile) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            
            // Add self to room participants in Firebase
            await setDoc(doc(db, `rooms/${activeNodeId}/participants`, profile.id), {
                id: profile.id,
                name: profile.username || profile.full_name || 'Anonymous',
                avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
                role: profile.role || 'member',
                joinedAt: serverTimestamp(),
            });

            setIsJoined(true);
            setIsMuted(false);
        } catch (error) {
            console.error("Microphone access denied or error:", error);
            alert("Sisteme katılmak için mikrofon izni gereklidir.");
        }
    };

    const leaveRoom = async () => {
        // Stop all local tracks
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;

        // Close peer connections
        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
        
        pendingCandidatesRef.current = {};
        setRemoteStreams({});
        setIsJoined(false);
        setIsScreenSharing(false);

        if (profile) {
            try {
                await deleteDoc(doc(db, `rooms/${activeNodeId}/participants`, profile.id));
            } catch (error) {}
        }
    };

    const toggleMic = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
    };

    const toggleScreenShare = async () => {
        if (!isJoined) return;
        
        if (isScreenSharing) {
            // Primitive disable: stops video tracks
            localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                
                screenTrack.onended = () => setIsScreenSharing(false);

                // Add to existing PC
                Object.values(peersRef.current).forEach(pc => {
                    if (localStreamRef.current) pc.addTrack(screenTrack, localStreamRef.current);
                });
                
                setIsScreenSharing(true);
            } catch (error) {
                console.error("Screen share failed:", error);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile) return;
        const messageText = newMessage;
        setNewMessage(''); 

        try {
            await addDoc(collection(db, `channels/${activeNodeId}/messages`), {
                text: messageText,
                userId: profile.id,
                username: profile.username || profile.full_name || 'Anonymous User',
                avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
                role: profile.role || 'member',
                createdAt: serverTimestamp()
            });
        } catch (error) {}
    };

    const onlineUsers = networkUsers.filter(u => u.status === 'online');
    const idleUsers = networkUsers.filter(u => u.status === 'idle');
    const offlineUsers = networkUsers.filter(u => u.status === 'offline');

    return (
        <Layout disableFooter hideNavPadding>
            <div className="pt-16 h-screen flex bg-[#030303] overflow-hidden font-sans">
                
                {/* 1. Left Sidebar: Subnets */}
                <div className="w-[72px] bg-dev-black border-r border-white/5 flex flex-col items-center py-4 space-y-4 shrink-0 z-10">
                    <button className="w-12 h-12 rounded-xl bg-neon-violet flex items-center justify-center text-white hover:rounded-3xl transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                        <Terminal size={24} />
                    </button>
                    
                    <div className="w-8 h-[2px] bg-white/10 rounded-full" />

                    {SUBNETS.map((subnet) => (
                        <div key={subnet.id} className="relative group flex items-center justify-center">
                            <div className={`absolute left-0 w-1 bg-white rounded-r-lg transition-all duration-300 ${activeSubnet === subnet.id ? 'h-8' : 'h-0 group-hover:h-5'}`} />
                            
                            <button
                                onClick={() => {
                                    setActiveSubnet(subnet.id);
                                    const firstNode = NODES[subnet.id]?.[0];
                                    if(firstNode) setActiveNodeId(firstNode.id);
                                }}
                                className={`w-12 h-12 flex items-center justify-center transition-all duration-300
                                ${activeSubnet === subnet.id 
                                    ? 'bg-neon-violet/20 text-neon-violet rounded-xl shadow-[inset_0_0_12px_rgba(139,92,246,0.3)]' 
                                    : 'bg-white/5 text-gray-400 rounded-[24px] hover:rounded-xl hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <subnet.icon size={22} />
                            </button>
                        </div>
                    ))}
                    
                    <div className="w-8 h-[2px] bg-white/10 rounded-full mt-auto" />
                    
                    <button className="w-12 h-12 rounded-[24px] bg-white/5 flex items-center justify-center text-gray-400 hover:rounded-xl hover:bg-white/10 hover:text-green-400 transition-all duration-300">
                        <Zap size={22} className="opacity-80 group-hover:opacity-100" />
                    </button>
                </div>

                {/* 2. Middle Sidebar: Nodes */}
                <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col shrink-0">
                    <div className="h-14 flex items-center px-4 border-b border-white/5 shadow-sm group cursor-pointer hover:bg-white/5 transition-colors">
                        <h2 className="font-bold text-gray-200 flex-1 truncate font-mono tracking-tight">
                            {SUBNETS.find(s => s.id === activeSubnet)?.name.toUpperCase()}
                        </h2>
                        <ChevronDown size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
                        {/* Text Nodes */}
                        <div>
                            <div className="flex items-center text-xs font-bold text-gray-500 mb-2 px-2 tracking-wider">
                                <Activity size={12} className="mr-2" /> DATA STREAMS
                            </div>
                            <div className="space-y-0.5">
                                {NODES[activeSubnet]?.filter(n => n.type === 'text').map(node => (
                                    <button 
                                        key={node.id}
                                        onClick={() => {
                                            if (isJoined) leaveRoom();
                                            setActiveNodeId(node.id);
                                        }}
                                        className={`w-full flex items-center px-2 py-1.5 rounded-md transition-all group ${
                                            activeNodeId === node.id 
                                                ? 'bg-white/10 text-white' 
                                                : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                                        }`}
                                    >
                                        <Hash size={18} className={`mr-2 ${activeNodeId === node.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`} />
                                        <span className={`truncate text-sm font-medium ${activeNodeId === node.id ? 'font-semibold' : ''}`}>{node.name}</span>
                                        {node.locked && <Lock size={12} className="ml-auto text-gray-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Nodes */}
                        <div>
                            <div className="flex items-center text-xs font-bold text-gray-500 mb-2 px-2 tracking-wider">
                                <Radio size={12} className="mr-2" /> VOICE LINKS
                            </div>
                            <div className="space-y-1">
                                {NODES[activeSubnet]?.filter(n => n.type === 'voice').map(node => (
                                    <div key={node.id}>
                                        <button 
                                            onClick={() => {
                                                if(isJoined && activeNodeId !== node.id) leaveRoom();
                                                setActiveNodeId(node.id);
                                            }}
                                            className={`w-full flex items-center px-2 py-1.5 rounded-md transition-all ${
                                                activeNodeId === node.id 
                                                    ? 'bg-white/10 text-white' 
                                                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                                            }`}
                                        >
                                            <Volume2 size={18} className={`mr-2 ${activeNodeId === node.id ? 'text-neon-violet' : 'text-gray-500'}`} />
                                            <span className="truncate text-sm font-medium flex-1 text-left">{node.name}</span>
                                            {node.users > 0 && (
                                                <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-gray-400 font-mono">
                                                    {node.users}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current User Control Panel */}
                    <div className="bg-[#111] p-3 border-t border-white/5 flex items-center space-x-2">
                        <div className="relative group cursor-pointer shrink-0">
                            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'guest'}`} className="w-10 h-10 rounded-lg bg-gray-800" alt="ME" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#111] rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0 pr-1 cursor-pointer">
                            <div className="text-sm font-bold text-white truncate">{profile?.username || 'Guest'}</div>
                            <div className="text-xs text-gray-400 truncate">#{profile?.role || 'member'}</div>
                        </div>
                        <div className="flex shrink-0">
                            <button 
                                onClick={toggleMic}
                                disabled={!isJoined}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 ${isMuted && isJoined ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Main Area: Nexus Visualization or Chat Canvas */}
                <div className="flex-1 flex flex-col bg-dev-black relative min-w-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_100%)] pointer-events-none" />
                    
                    {/* Header */}
                    <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between shrink-0 bg-[#0a0a0a]/50 backdrop-blur-md z-10">
                        <div className="flex items-center space-x-4">
                            {channelType === 'text' ? <Hash size={24} className="text-gray-400" /> : <Volume2 size={24} className="text-gray-400" />}
                            <h3 className="font-bold text-white tracking-wide">
                                {currentNode?.name || 'Unknown Node'}
                            </h3>
                            <div className="h-4 w-px bg-white/10" />
                            {channelType === 'text' ? (
                                <span className="text-sm text-gray-400">
                                    Secure encryption enabled
                                </span>
                            ) : (
                                <span className="text-sm text-gray-400 flex items-center">
                                    <Wifi size={14} className={`mr-1.5 ${isJoined ? 'text-green-500' : 'text-gray-600'}`} /> 
                                    {isJoined ? 'P2P Mesh Synced' : 'Offline / Standby'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Conditional Mid Content: Voice Avatars vs Text Chat */}
                    {channelType === 'voice' ? (
                        <>
                            {/* RENDER AUDIO ELEMENTS INVISIBLY FOR WebRTC STREAMS */}
                            {Object.entries(remoteStreams).map(([peerId, stream]) => (
                                <audio
                                    key={peerId}
                                    autoPlay
                                    playsInline
                                    ref={node => { if (node && node.srcObject !== stream) node.srcObject = stream; }}
                                />
                            ))}

                            {/* Active Voice Canvas */}
                            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto z-10">
                                
                                {!isJoined ? (
                                    // Not Joined State - Beautiful CTA directly in the canvas
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mb-8 animate-[spin_20s_linear_infinite]">
                                            <Activity size={48} className="text-neon-violet opacity-50" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white font-mono tracking-widest mb-2">NEURAL LINK STANDBY</h2>
                                        <p className="text-gray-400 mb-8 max-w-sm text-center">Establish P2P connection to {currentNode?.name} and sync with the network.</p>
                                        
                                        <button 
                                            onClick={joinRoom}
                                            className="px-8 py-4 bg-neon-violet hover:bg-neon-violet/80 text-white rounded-xl font-bold flex items-center space-x-3 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                                        >
                                            <LinkIcon size={20} />
                                            <span>INITIALIZE MESH NETWORK</span>
                                        </button>
                                    </div>
                                ) : (
                                    // Joined Voice Canvas Avatar Grid
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
                                        
                                        {/* The Current LOCAL User Voice Card */}
                                        <div className="relative group perspective-1000">
                                            <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 transform group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${!isMuted ? 'border-neon-violet/50 shadow-[0_0_30px_rgba(139,92,246,0.15)]' : 'border-white/10'}`}>
                                                
                                                {!isMuted && (
                                                    <>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-neon-violet/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-neon-violet/10 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_100ms]" />
                                                    </>
                                                )}

                                                <div className="relative z-10">
                                                    <div className={`w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden border-4 transition-colors duration-300 ${!isMuted ? 'border-neon-violet' : 'border-[#2a2a2a]'}`}>
                                                        <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} className="w-full h-full object-cover" alt={profile?.username} />
                                                    </div>
                                                    {isMuted && (
                                                        <div className="absolute -bottom-2 -right-2 bg-[#2a2a2a] rounded-full p-2 border-2 border-dev-black">
                                                            <MicOff size={14} className="text-red-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 flex items-center space-x-2 z-10 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                                                    <span className={`font-medium ${!isMuted ? 'text-white' : 'text-gray-300'}`}>{profile?.username || '(You)'}</span>
                                                    {roleBadge(profile?.role || 'member')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* WebRTC REMOTE Users Mapping directly from Firestore Participants */}
                                        {roomParticipants.map((user) => {
                                            const hasAudio = !!remoteStreams[user.id];
                                            
                                            return (
                                            <div key={user.id} className="relative group perspective-1000">
                                                <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 transform group-hover:-translate-y-1 ${hasAudio ? 'border-neon-violet/30 hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)]' : 'border-white/10'}`}>
                                                    
                                                    {hasAudio && (
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-neon-violet/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                                    )}

                                                    <div className="relative z-10">
                                                        <div className={`w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden border-4 transition-colors duration-300 ${hasAudio ? 'border-neon-violet' : 'border-[#2a2a2a]'}`}>
                                                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                                        </div>
                                                        {!hasAudio && (
                                                            <div className="absolute -bottom-2 -right-2 bg-[#2a2a2a] rounded-full p-2 border-2 border-dev-black">
                                                                <MicOff size={14} className="text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex items-center space-x-2 z-10 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                                                        <span className="font-medium text-gray-300">{user.name}</span>
                                                        {roleBadge(user.role)}
                                                    </div>
                                                </div>
                                            </div>
                                        )})}
                                        
                                    </div>
                                )}
                            </div>

                            {/* Bottom Voice Action Bar */}
                            <div className="h-24 pb-4 px-8 flex justify-center items-end shrink-0 z-10">
                                <div className={`bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center space-x-2 shadow-2xl transition-opacity duration-300 ${!isJoined ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    
                                    {/* Mic Toggle */}
                                    <button 
                                        onClick={toggleMic}
                                        disabled={!isJoined}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-gray-200 bg-white/5 hover:bg-white/10 hover:text-white'}`}
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                                    </button>
                                    
                                    <div className="w-px h-8 bg-white/10 mx-2" />
                                    
                                    {/* Screen Share */}
                                    <button 
                                        onClick={toggleScreenShare}
                                        disabled={!isJoined}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isScreenSharing ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-gray-200 bg-white/5 hover:bg-white/10 hover:text-white'}`}
                                        title="Share Screen"
                                    >
                                        <Monitor size={22} />
                                    </button>

                                    <div className="w-px h-8 bg-white/10 mx-2" />

                                    {/* Hang Up */}
                                    <button 
                                        onClick={leaveRoom}
                                        disabled={!isJoined}
                                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all transform hover:scale-105" 
                                        title="Disconnect"
                                    >
                                        <PhoneOff size={22} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Active Text Canvas */
                        <div className="flex-1 flex flex-col z-10 bg-[#060606]/80 backdrop-blur-md">
                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 pointer-events-none">
                                        <Hash size={48} className="mb-4 text-neon-violet opacity-30" />
                                        <p className="font-mono">Start the flow in #{currentNode?.name}</p>
                                    </div>
                                )}
                                
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex group hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors">
                                        <img src={msg.avatarUrl} className="w-10 h-10 rounded-xl bg-gray-800 shrink-0 object-cover border border-white/5" alt={msg.username} />
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">
                                                    {msg.username}
                                                </span>
                                                {roleBadge(msg.role)}
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                            
                            {/* Chat Input */}
                            <div className="p-4 px-6 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 shrink-0">
                                <form onSubmit={handleSendMessage} className="relative flex items-center">
                                    <button type="button" className="absolute left-4 text-gray-500 hover:text-white transition-colors">
                                        <Zap size={20} />
                                    </button>
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Transmit to #${currentNode?.name}`}
                                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50 focus:ring-1 focus:ring-neon-violet/50 transition-all font-sans"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim()}
                                        className="absolute right-4 text-gray-400 hover:text-neon-violet transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <Send size={20} className={newMessage.trim() ? "fill-neon-violet/20" : ""} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Right Sidebar: Network Entities */}
                <div className="w-64 bg-[#0a0a0a] border-l border-white/5 hidden lg:flex flex-col shrink-0 overflow-hidden">
                    <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
                        <span className="font-bold text-gray-200 font-mono tracking-wider text-sm flex items-center">
                            <Radio size={16} className="mr-2 text-green-500 animate-pulse" /> NETWORK STATUS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar block">
                        
                        {networkUsers.length === 0 && (
                            <div className="text-gray-500 text-sm italic opacity-50">Scanning network...</div>
                        )}

                        {/* Status Groups */}
                        {onlineUsers.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-3 ml-1 font-mono tracking-widest">
                                    ONLINE SYNDICATE — {onlineUsers.length}
                                </div>
                                <div className="space-y-1">
                                    {onlineUsers.map(user => (
                                        <UserListItem key={user.id} user={user} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {idleUsers.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-3 ml-1 font-mono tracking-widest">
                                    AWAY / IDLE — {idleUsers.length}
                                </div>
                                <div className="space-y-1 opacity-70">
                                    {idleUsers.map(user => (
                                        <UserListItem key={user.id} user={user} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {offlineUsers.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-gray-500 mb-3 ml-1 font-mono tracking-widest overflow-hidden">
                                    OFFLINE GRID — {offlineUsers.length}
                                </div>
                                <div className="space-y-1 opacity-40 grayscale hover:grayscale-0 transition-all">
                                    {offlineUsers.map(user => (
                                        <UserListItem key={user.id} user={user} />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </Layout>
    );
}

// Helper components
function roleBadge(role: string) {
    if (role === 'creator') return <Shield size={12} className="text-yellow-500 ml-1 shrink-0" />;
    if (role === 'admin') return <Crown size={12} className="text-neon-violet ml-1 shrink-0" />;
    return null;
}

function roleIcon(role: string) {
    if (role === 'creator') return <Shield size={14} className="text-yellow-500 ml-1.5 opacity-80 shrink-0" />;
    if (role === 'admin') return <Crown size={14} className="text-neon-violet ml-1.5 opacity-80 shrink-0" />;
    return null;
}

function UserListItem({ user }: { user: any }) {
    return (
        <div className="flex items-center group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all">
            <div className="relative shrink-0">
                <img src={user.avatar} className="w-8 h-8 rounded-full bg-gray-800 object-cover" alt={user.name} />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
                    user.status === 'online' ? 'bg-green-500' :
                    user.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-600'
                }`} />
            </div>
            <div className="ml-3 flex-1 min-w-0 pr-1">
                <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                        {user.name}
                    </span>
                    {roleBadge(user.role)}
                </div>
                <div className="text-xs text-gray-500 truncate font-mono">
                    {user.status === 'online' ? 'Active Sync' : user.status === 'idle' ? 'In the zone' : 'Disconnected'}
                </div>
            </div>
        </div>
    );
}
