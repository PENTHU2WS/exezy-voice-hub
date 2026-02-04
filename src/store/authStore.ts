import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
    // Computed on client
    rank?: Rank;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    initialize: () => Promise<void>;
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
    session: null,
    profile: null,
    loading: true,

    initialize: async () => {
        try {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // 2. Get Profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !error) {
                    const xp = profile.xp || 0;
                    const rank = getRankConfig(xp).name;
                    set({
                        user: session.user,
                        session,
                        profile: { ...profile, rank },
                        loading: false
                    });
                } else {
                    // Fallback if profile missing (shouldn't happen with triggers)
                    set({ user: session.user, session, profile: null, loading: false });
                }
            } else {
                set({ user: null, session: null, profile: null, loading: false });
            }

            // Listen for changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    if (profile) {
                        const rank = getRankConfig(profile.xp || 0).name;
                        set({ user: session.user, session, profile: { ...profile, rank } });
                    }
                } else {
                    set({ user: null, session: null, profile: null });
                }
            });

        } catch (e) {
            console.error("Auth Init Error:", e);
            set({ loading: false });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
    },

    addXp: async (amount: number) => {
        const { user, profile } = get();
        if (!user || !profile) return;

        const newXp = (profile.xp || 0) + amount;

        // Optimistic Update
        const oldRank = profile.rank;
        const newRankConfig = getRankConfig(newXp);
        const newRank = newRankConfig.name;

        set({ profile: { ...profile, xp: newXp, rank: newRank } });

        // DB Update
        const { error } = await supabase
            .from('profiles')
            .update({ xp: newXp })
            .eq('id', user.id);

        if (error) {
            console.error("XP Update Failed:", error);
            // Revert? For now, we accept minimal drift risks.
        } else {
            if (newRank !== oldRank) {
                document.dispatchEvent(new CustomEvent('levelUp', { detail: { rank: newRank } }));
            }
        }
    }
}));
