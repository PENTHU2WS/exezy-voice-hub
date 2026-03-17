export interface UserProfile {
    id: string;
    username: string;
    avatar_url?: string;
    xp: number;
    level: 'Junior' | 'Senior' | 'Staff' | 'Legend';
    bio?: string;
    full_name?: string;
    website?: string;
    location?: string;
    is_onboarded?: boolean;
    tech_stack?: string[];
    coins: number;
    github_url?: string;
    role?: string;
    badges?: { label: string; color?: string }[];
}

export interface Project {
    id: string;
    title: string;
    description: string;
    image_url: string;
    imageUrl?: string; // Hybrid support
    user_id: string;
    userId?: string; // Hybrid support
    tags: string[];
    likes: number;
    created_at: any; // Supports Firestore Timestamp
    code_snippet?: string;
    file_url?: string;
    file_name?: string;
    language_stats?: Record<string, number>;
    views: number;
    // Storage & Download (Hybrid Service)
    imageStoragePath?: string;
    zipStoragePath?: string;
    downloadUrl?: string;
    demoUrl?: string;
}

export interface ForumPost {
    id: string;
    user_id: string;
    author?: UserProfile;
    title: string;
    content: string;
    channel: string;
    likes: number;
    created_at: string;
    comments_count?: number; // Aggregated
}

export interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}
