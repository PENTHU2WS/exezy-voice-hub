import { create } from 'zustand';

// Types for Social Features
export interface Friend {
    id: string;
    username: string;
    avatar_url: string;
    status: 'online' | 'offline' | 'coding';
    full_name?: string;
}

export interface SocialNotification {
    id: string;
    user_id: string;
    type: 'like' | 'comment' | 'follow' | 'system';
    message: string;
    read: boolean;
    created_at: string;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
}

interface SocialState {
    notifications: SocialNotification[];
    followers: Friend[];
    following: Friend[];
    friends: Friend[]; // For compatibility with legacy widgets
    messages: Record<string, Message[]>;
    loading: boolean;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    markRead: (notifId: string) => Promise<void>;
    markAllRead: (userId: string) => Promise<void>;
    fetchNetwork: (userId: string) => Promise<void>;
    unfollow: (myId: string, targetId: string) => Promise<void>;
    sendMessage: (friendId: string, text: string) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
    notifications: [],
    followers: [],
    following: [],
    friends: [],
    messages: {},
    loading: false,

    fetchNotifications: async (userId) => {
        // Mock to avoid Firebase calls temporarily
        set({ notifications: [] });
    },

    markRead: async (notifId) => {
        set((state) => ({
            notifications: state.notifications.map(n => n.id === notifId ? { ...n, read: true } : n)
        }));
    },

    markAllRead: async (userId) => {
        set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
    },

    fetchNetwork: async (userId) => {
        set({ loading: true });
        // Mock network fetching
        set({
            followers: [],
            following: [],
            friends: [],
            loading: false
        });
    },

    unfollow: async (myId, targetId) => {
        set((state) => ({
            following: state.following.filter(f => f.id !== targetId),
            friends: state.friends.filter(f => f.id !== targetId)
        }));
    },

    sendMessage: (friendId, text) => set((state) => {
        const newMsg: Message = {
            id: Date.now().toString(),
            senderId: 'me',
            text,
            timestamp: new Date().toISOString()
        };
        const currentMsgs = state.messages[friendId] || [];
        return {
            messages: {
                ...state.messages,
                [friendId]: [...currentMsgs, newMsg]
            }
        };
    })
}));
