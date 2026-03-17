import { create } from 'zustand';
import { auth } from '../lib/config';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';

// Rank Thresholds
const RANKS = [
    { name: 'Junior', min: 0, max: 499, color: 'text-gray-400', glow: 'shadow-gray-400/50' },
    { name: 'Senior', min: 500, max: 1499, color: 'text-yellow-400', glow: 'shadow-yellow-400/50' },
    { name: 'Staff', min: 1500, max: 4999, color: 'text-purple-400', glow: 'shadow-purple-400/50' },
    { name: 'Legend', min: 5000, max: Infinity, color: 'text-purple-600 animate-pulse', glow: 'shadow-purple-600/50' },
] as const;

export type Rank = typeof RANKS[number]['name'];

export interface UserProfile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    xp: number;
    website?: string;
    bio?: string;
    location?: string;
    is_onboarded?: boolean;
    tech_stack?: string[];
    coins: number;
    github_url?: string;
    role?: string;
    badges?: { label: string; color?: string }[];
    rank?: Rank;
}

interface AuthState {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
    initialize: () => void;
    signOut: () => Promise<void>;
    addXp: (amount: number) => Promise<void>;
}

export const getRankConfig = (xp: number) => {
    return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0];
};

export const getNextLevelXp = (xp: number) => {
    const rank = getRankConfig(xp);
    if (rank.max === Infinity) return xp;
    return rank.max + 1;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    loading: true,

    initialize: () => {
        set({ loading: true });
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // To be implemented: fetch profile from Firestore
                // For now, we mock the profile
                const mockProfile: UserProfile = {
                    id: user.uid,
                    username: user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User',
                    full_name: user.displayName || 'User',
                    avatar_url: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                    xp: 0,
                    coins: 100,
                    is_onboarded: true,
                    rank: 'Junior'
                };
                set({ user, profile: mockProfile, loading: false });
            } else {
                set({ user: null, profile: null, loading: false });
            }
        }, (error) => {
            console.error("Auth Init Error:", error);
            set({ user: null, profile: null, loading: false });
        });
    },

    signOut: async () => {
        try {
            await firebaseSignOut(auth);
        } catch (e) {
            console.error(e);
        }
        set({ user: null, profile: null });
    },

    addXp: async (amount: number) => {
        const { profile } = get();
        if (!profile) return;

        const newXp = (profile.xp || 0) + amount;
        const newRank = getRankConfig(newXp).name;

        set({ profile: { ...profile, xp: newXp, rank: newRank } });
        // To be implemented: update XP in Firestore
    }
}));
