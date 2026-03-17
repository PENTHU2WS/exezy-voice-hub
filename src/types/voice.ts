export interface VoiceNote {
    id: string;
    title: string;
    category: string;
    audioUrl: string;
    uploaderId: string;
    uploaderName: string;
    uploaderAvatar: string;
    duration: string;
    createdAt: any;
}

export interface VoiceCategory {
    id: string;
    name: string;
    description: string;
    count: number;
    icon: string;
    color: string;
}
