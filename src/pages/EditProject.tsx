import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { db } from '../lib/config';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export function EditProject() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [tags, setTags] = useState(''); // Comma separated string for input

    useEffect(() => {
        if (!id || !user) return;

        const fetchProject = async () => {
             // Mock Project
             try {
                setTitle('Mock Project');
                setDescription('Description...');
                setDemoUrl('http://demo.com');
                setTags('React, Appwrite');
             } catch(err) {
                console.error(err);
             } finally {
                 setLoading(false);
             }
        };

        fetchProject();
    }, [id, user, navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSaving(true);
        setError('');

        try {
            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
            
            // Mock saving
            alert('Mock save successful!');
            navigate(`/project/${id}`);
        } catch (err) {
            console.error("Error saving project:", err);
            setError("Failed to save changes. Please try again.");
            setSaving(false);
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

    return (
        <Layout>
            <div className="min-h-screen bg-black pb-12 pt-8">
                <div className="container mx-auto px-4 max-w-2xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
                        <h1 className="text-3xl font-black text-white mb-8 border-b border-[#2a2a2a] pb-4">
                            Edit Project
                        </h1>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Project Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                    placeholder="Enter project title"
                                    required
                                />
                            </div>

                            {/* Demo URL */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Live Demo URL
                                </label>
                                <input
                                    type="url"
                                    value={demoUrl}
                                    onChange={(e) => setDemoUrl(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                    placeholder="https://example.com"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[200px] resize-y"
                                    placeholder="Describe your project..."
                                    required
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Tags (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                    placeholder="React, TypeScript, Firebase..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Separate tags with commas. Example: React, UI, Dashboard
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => navigate(`/project/${id}`)}
                                    className="flex-1 bg-[#222] hover:bg-[#333] text-white border border-[#333]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Save className="w-4 h-4" /> Save Changes
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
