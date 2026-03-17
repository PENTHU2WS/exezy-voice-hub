// import { db, storage } from './config';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const sanitizeFileName = (fileName: string) => {
    return fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase();
};

export async function uploadProject(
    imageFile: File,
    zipFile: File,
    metadata: any,
    userId: string
) {
    try {
        if (!userId) throw new Error("Kullanıcı kimliği (ID) bulunamadı!");

        // Mock url
        const imageUrl = `https://mock.url/image_${Date.now()}`;
        const downloadUrl = `https://mock.url/zip_${Date.now()}`;
        const docId = `mock-project-${Date.now()}`;

        console.log("Mock uploaded project:", {
            ...metadata,
            userId: userId,
            imageUrl: imageUrl,
            downloadUrl: downloadUrl,
        });

        return docId;

    } catch (error: any) {
        throw error;
    }
}

export async function uploadVoiceNote(
    audioFile: File,
    metadata: { title: string; category: string; uploaderId: string; uploaderName: string; uploaderAvatar: string; duration: string }
) {
    try {
        // Mock url
        const audioUrl = `https://mock.url/voice_${Date.now()}`;
        const docId = `mock-voice-${Date.now()}`;

        console.log("Mock uploaded voice note:", {
            ...metadata,
            audioUrl
        });

        return docId;
    } catch (error: any) {
        throw error;
    }
}
