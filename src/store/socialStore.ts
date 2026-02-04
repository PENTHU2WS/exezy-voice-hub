import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ notifications: data as SocialNotification[] });
        }
    },

    markRead: async (notifId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notifId);

        if (!error) {
            set((state) => ({
                notifications: state.notifications.map(n => n.id === notifId ? { ...n, read: true } : n)
            }));
        }
    },

    markAllRead: async (userId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);

        if (!error) {
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true }))
            }));
        }
    },

    fetchNetwork: async (userId) => {
        set({ loading: true });
        try {
            // Fetch Followers (users who follow me)
            const { data: fers, error: fersErr } = await supabase
                .from('follows')
                .select('follower:profiles!follower_id(*)')
                .eq('following_id', userId);

            // Fetch Following (users I follow)
            const { data: fing, error: fingErr } = await supabase
                .from('follows')
                .select('following:profiles!following_id(*)')
                .eq('follower_id', userId);

            if (!fersErr && fers) {
                const mappedFers = fers.map((f: any) => ({
                    ...f.follower,
                    status: 'online' // Mock status for now
                } as Friend));
                set({ followers: mappedFers });
            }
            if (!fingErr && fing) {
                const mappedFing = fing.map((f: any) => ({
                    ...f.following,
                    status: 'online'
                } as Friend));
                set({ following: mappedFing, friends: mappedFing }); // Alias following to friends for the widget
            }
        } finally {
            set({ loading: false });
        }
    },

    unfollow: async (myId, targetId) => {
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', myId)
            .eq('following_id', targetId);

        if (!error) {
            set((state) => ({
                following: state.following.filter(f => f.id !== targetId),
                friends: state.friends.filter(f => f.id !== targetId)
            }));
        }
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
