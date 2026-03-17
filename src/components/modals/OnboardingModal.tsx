import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { storage } from '../../lib/config';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../common/Button';
import { Camera, Dice5, Check, ChevronRight, User, MapPin, Code, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function OnboardingModal() {
    const { user, profile } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [selectedTech, setSelectedTech] = useState<string[]>([]);

    // Avatar State
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'robot'>('male');
    const [randomSeed, setRandomSeed] = useState(Date.now().toString());

    const [usernameError, setUsernameError] = useState('');

    const TECH_STACKS = [
        "React", "Vue", "Angular", "Svelte",
        "Node.js", "Python", "Go", "Rust",
        "Java", "C#", "C++", "PHP",
        "TypeScript", "JavaScript", "Swift",
        "Kotlin", "Flutter", "React Native",
        "Docker", "Kubernetes", "AWS", "Firebase"
    ];

    // Initialize state from existing profile if available
    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setAvatarUrl(profile.avatar_url || '');
            setBio(profile.bio || '');
            setLocation(profile.location || '');
            setWebsite(profile.website || '');
            setSelectedTech(profile.tech_stack || []);
        } else if (user) {
            setUsername(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || '');
            setAvatarUrl(user.photoURL || '');
        }
    }, [profile, user]);

    // Generate Avatar URL based on style and seed
    const getAvatarUrl = () => {
        const seed = randomSeed;
        let url = '';

        if (selectedGender === 'male') {
            // Adventurer Male
            url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&baseColor=f9c9b6`;
        } else if (selectedGender === 'female') {
            // Adventurer Female (with long hair)
            url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&baseColor=f9c9b6&longHair=true`;
        } else {
            // Robot
            url = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
        }
        return url;
    };

    // Update avatar when style or seed changes
    useEffect(() => {
        if (!avatarUrl.startsWith('http')) { // Only update if not uploaded custom image
            setAvatarUrl(getAvatarUrl());
        }
    }, [selectedGender, randomSeed]);

    // Randomize Avatar
    const handleRandomizeAvatar = () => {
        setRandomSeed(Math.random().toString(36).substring(7));
        // Reset to generated URL if user had uploaded an image
        setAvatarUrl(getAvatarUrl());
    };

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);

        // Instant Preview
        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);

        try {
            // Mock upload
            setTimeout(() => {
                setAvatarUrl(previewUrl);
                setLoading(false);
            }, 500);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload Failed: ${error.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const validateStep1 = async () => {
        if (username.length < 3) return setUsernameError("Username must be at least 3 chars");

        setLoading(true);
        // Mock uniqueness check
        setTimeout(() => {
            setUsernameError('');
            setLoading(false);
            if (!avatarUrl) handleRandomizeAvatar();
            setStep(2);
        }, 500);
    };

    const toggleTech = (tech: string) => {
        if (selectedTech.includes(tech)) {
            setSelectedTech(prev => prev.filter(t => t !== tech));
        } else {
            if (selectedTech.length >= 8) return; // Max limit
            setSelectedTech(prev => [...prev, tech]);
        }
    };

    const handleFinish = async () => {
        try {
            setLoading(true);

            // Mock saving
            const updates = {
                username: username,
                bio: bio,
                location: location,
                website: website,
                tech_stack: Array.isArray(selectedTech) ? selectedTech : [], // Ensure Array
                avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                is_onboarded: true,
                updated_at: new Date().toISOString(),
            };

            console.log("Mock Profile Post:", updates);

            // Mock appwrite store initialize call
            const authStore = (await import('../../store/authStore')).useAuthStore.getState();
            await authStore.initialize();
        } catch (error: any) {
            console.error('PROFILE SAVE ERROR:', error);
            alert('Save Failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-900/10 to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Welcome to HUB</h2>
                    </div>
                    <p className="text-gray-400 text-sm">Let's set up your developer identity.</p>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mt-6">
                        <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 1 ? "bg-purple-500" : "bg-white/10")} />
                        <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 2 ? "bg-purple-500" : "bg-white/10")} />
                        <div className={cn("h-1 flex-1 rounded-full transition-colors", step >= 3 ? "bg-purple-500" : "bg-white/10")} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* Avatar */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-purple-500/30 p-1 flex items-center justify-center overflow-hidden bg-black relative">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-white/20" />
                                            )}

                                            {/* Hover Upload Overlay */}
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="w-8 h-8 text-white mb-4" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-3 w-full max-w-xs">

                                        {/* Style Selector */}
                                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full mb-2">
                                            {(['male', 'female', 'robot'] as const).map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => {
                                                        setSelectedGender(style);
                                                        setRandomSeed(Math.random().toString());
                                                    }}
                                                    className={cn(
                                                        "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                        selectedGender === style
                                                            ? "bg-purple-600 text-white shadow-lg"
                                                            : "text-gray-500 hover:text-gray-300"
                                                    )}
                                                >
                                                    {style === 'male' ? '👨 Male' : style === 'female' ? '👩 Female' : '🤖 Robot'}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button size="sm" variant="outline" onClick={handleRandomizeAvatar} className="text-xs">
                                                <Dice5 className="w-3 h-3 mr-2" /> Randomize
                                            </Button>
                                            <div className="relative">
                                                <Button size="sm" variant="outline" className="text-xs">
                                                    <Camera className="w-3 h-3 mr-2" /> Upload
                                                </Button>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={handleImageUpload}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => {
                                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                            setUsernameError('');
                                        }}
                                        className={cn(
                                            "w-full h-12 bg-white/5 border rounded-xl px-4 text-white font-mono outline-none focus:border-purple-500/50 transition-colors",
                                            usernameError ? "border-red-500/50" : "border-white/10"
                                        )}
                                        placeholder="username"
                                    />
                                    {usernameError && <p className="text-red-400 text-xs">{usernameError}</p>}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-3 h-3" /> Bio
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none h-24 focus:border-purple-500/50 outline-none text-sm"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Location
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-purple-500/50 outline-none"
                                        placeholder="City, Country"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-3 h-3" /> Website
                                    </label>
                                    <input
                                        type="url"
                                        value={website}
                                        onChange={e => setWebsite(e.target.value)}
                                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-purple-500/50 outline-none"
                                        placeholder="https://your-portfolio.com"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tech Stack</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TECH_STACKS.map(tech => (
                                            <button
                                                key={tech}
                                                onClick={() => toggleTech(tech)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                                    selectedTech.includes(tech)
                                                        ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20"
                                                        : "bg-white/5 text-gray-400 border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                {tech}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-600">Select up to 8 technologies.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/40">
                    <div className="text-gray-500 text-xs font-medium">Step {step} of 2</div>

                    <div className="flex gap-3">
                        {step > 1 && (
                            <Button variant="ghost" onClick={() => setStep(step - 1)}>
                                Back
                            </Button>
                        )}
                        {step === 1 ? (
                            <Button
                                onClick={validateStep1}
                                isLoading={loading}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-8"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinish}
                                isLoading={loading}
                                className="bg-green-600 hover:bg-green-500 text-white px-8"
                            >
                                Finish Setup <Check className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
