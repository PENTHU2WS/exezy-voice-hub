import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Image as ImageIcon, FileArchive, Save, Loader2, Tag, CloudUpload } from 'lucide-react';
// import { auth } from '../lib/config';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export function UploadProject() {
    const { addXp } = useAuthStore();
    const navigate = useNavigate();

    // UI State
    const [loading, setLoading] = useState(false);
    const [btnText, setBtnText] = useState('Publish Project');

    // Form Data
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    // Files
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);

    // Handlers
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setZipFile(e.target.files[0]);
        }
    };

    // --- LOGIC ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ADIM 0: Validasyon
        if (!title.trim() || !description.trim() || !tagsInput.trim()) {
            return alert('Lütfen Başlık, Açıklama ve Etiket alanlarını doldurun!');
        }
        if (!imageFile) return alert('Lütfen bir Kapak Resmi seçin!');
        if (!zipFile) return alert('Lütfen bir Proje Dosyası (Zip/Rar) seçin!');

        // Dosya boyutu kontrolü (50 MB limit)
        if (zipFile && zipFile.size > 50 * 1024 * 1024) {
            alert("⚠️ HATA: Dosya boyutu 50 MB'ı geçemez! Lütfen daha küçük bir dosya yükleyin.");
            return;
        }

        // ADIM 1: Hazırlık
        setLoading(true);
        setBtnText('Checking User...');

        try {
            // Check Appwrite user from store
            const { user } = useAuthStore.getState();
            if (!user) throw new Error("Kullanıcı oturumu bulunamadı! Lütfen giriş yapın.");

            // Metadata hazırla
            setBtnText('Preparing upload...');
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

            const metadata = {
                title: title,
                description: description,
                tags: tagsArray,
                user_id: (user as any).$id || (user as any).uid || 'mock-user-id',
                file_name: zipFile.name
            };

            // hybridService kullanarak yükle
            setBtnText('Uploading files...');
            const { uploadProject } = await import('../lib/hybridService');
            await uploadProject(imageFile, zipFile, metadata, (user as any).$id || (user as any).uid || 'mock-user-id');

            // Başarılı
            await addXp(250);
            alert('Proje Başarıyla Yüklendi! 🚀');
            navigate('/');

        } catch (error: any) {
            console.error(error);
            alert('HATA: ' + error.message);
        } finally {
            setLoading(false);
            setBtnText('Publish Project');
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-3xl bg-[#0a0a0a] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden relative">

                    {/* Header */}
                    <div className="bg-purple-900/10 p-6 border-b border-purple-500/20 flex items-center gap-3">
                        <CloudUpload className="w-8 h-8 text-purple-400" />
                        <h1 className="text-2xl font-bold text-white tracking-wide">Upload New Project</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">

                        {/* Title */}
                        <div>
                            <label className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2 block">Project Title</label>
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="My Final Project"
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2 block">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Explain what this project does..."
                                className="w-full h-32 bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cover Image */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-blue-400 uppercase tracking-wider block flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Cover Image
                                </label>
                                <input
                                    type="file" accept="image/*" onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 cursor-pointer bg-[#111] rounded-lg border border-white/10 p-2"
                                />
                            </div>

                            {/* Zip File */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-green-400 uppercase tracking-wider block flex items-center gap-2">
                                    <FileArchive className="w-4 h-4" /> Project File (Zip)
                                </label>
                                <input
                                    type="file" accept=".zip,.rar,.7z,.tar" onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 cursor-pointer bg-[#111] rounded-lg border border-white/10 p-2"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Tags (Comma Separated)
                            </label>
                            <input
                                value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                                placeholder="React, Node.js, AI (Separate with comma)"
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-white/10">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transition-all"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin w-5 h-5" /> {btnText}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-5 h-5" /> {btnText}
                                    </span>
                                )}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </Layout>
    );
}

