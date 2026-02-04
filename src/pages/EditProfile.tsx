import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Save, User as UserIcon, Globe, MapPin, Github, AlertCircle } from 'lucide-react';

export function EditProfile() {
    const { user, profile, initialize } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        website: '',
        location: '',
        avatar_url: '',
        github_url: '' // Future use or purely cosmetic for now if not in DB scheme yet
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                website: profile.website || '',
                location: profile.location || '',
                avatar_url: profile.avatar_url || '',
                github_url: ''
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!user) throw new Error("No user logged in");

            const updates = {
                id: user.id,
                full_name: formData.full_name,
                bio: formData.bio,
                website: formData.website,
                location: formData.location,
                avatar_url: formData.avatar_url,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            await initialize(); // Refresh store
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Optional: Redirect back after short delay
            setTimeout(() => navigate('/profile'), 1500);

        } catch (error: any) {
            console.error("Update Error:", error);
            setMessage({ type: 'error', text: error.message || "Failed to update profile" });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-400">Please sign in to edit your profile.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
                            <p className="text-gray-400">Customize how you appear to the community.</p>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/profile')}>Cancel</Button>
                    </div>

                    <div className="bg-dev-card border border-neon-violet/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.1)]">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                                <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden bg-black/50">
                                    {formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-8 h-8 text-gray-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
                                    <input
                                        type="url"
                                        value={formData.avatar_url}
                                        onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                                        placeholder="https://github.com/username.png"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-neon-violet focus:outline-none transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">We recommend using your GitHub avatar URL.</p>
                                </div>
                            </div>

                            {/* Main Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-neon-violet focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-neon-violet focus:outline-none transition-colors"
                                            placeholder="San Francisco, CA"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-neon-violet focus:outline-none transition-colors h-32 resize-none"
                                    placeholder="Tell us about your stack, interests, and what you're building..."
                                />
                            </div>

                            {/* Links */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Website</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-neon-violet focus:outline-none transition-colors"
                                            placeholder="https://portfolio.dev"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">GitHub Profile</label>
                                    <div className="relative">
                                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="url"
                                            value={formData.github_url}
                                            onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-neon-violet focus:outline-none transition-colors"
                                            placeholder="https://github.com/username"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Message */}
                            {message && (
                                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-neon-violet hover:bg-neon-violet/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] min-w-[120px]"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </Button>
                            </div>

                        </form>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}
