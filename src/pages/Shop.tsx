import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common/Button';
// import { db } from '../lib/config';
// import { doc, updateDoc } from 'firebase/firestore';
import { Wallet, ShoppingCart, Shield, Zap, Gift, CheckCircle, Loader2, Sparkles, Crown, Star, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: any;
    gradient: string;
    category: 'boost' | 'cosmetic' | 'feature';
    badge?: string;
}

const ITEMS: ShopItem[] = [
    {
        id: 'xp_boost_1h',
        name: 'XP Surge',
        description: '2x XP multiplier for 1 hour. Stack with other boosts!',
        price: 500,
        icon: Zap,
        gradient: 'from-yellow-500 to-orange-500',
        category: 'boost',
        badge: 'Popular'
    },
    {
        id: 'dark_mode_plus',
        name: 'Neon Aura',
        description: 'Exclusive animated profile border with neon glow effects.',
        price: 1200,
        icon: Sparkles,
        gradient: 'from-pink-500 to-purple-500',
        category: 'cosmetic',
        badge: 'New'
    },
    {
        id: 'pro_badge',
        name: 'Elite Badge',
        description: 'Display a premium Elite badge on your profile and posts.',
        price: 2500,
        icon: Shield,
        gradient: 'from-purple-500 to-indigo-500',
        category: 'feature',
        badge: 'Exclusive'
    },
    {
        id: 'gift_box',
        name: 'Loot Crate',
        description: 'Random rewards: 100-1000 XP or 50-500 Coins!',
        price: 300,
        icon: Gift,
        gradient: 'from-green-500 to-emerald-500',
        category: 'boost'
    },
    {
        id: 'xp_boost_24h',
        name: 'XP Overdrive',
        description: '3x XP multiplier for 24 hours. Maximum gains!',
        price: 2000,
        icon: Flame,
        gradient: 'from-red-500 to-orange-500',
        category: 'boost',
        badge: 'Hot'
    },
    {
        id: 'custom_badge',
        name: 'Custom Emblem',
        description: 'Design your own custom badge with text and colors.',
        price: 5000,
        icon: Crown,
        gradient: 'from-blue-500 to-cyan-500',
        category: 'feature',
        badge: 'Premium'
    },
];

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: ShoppingCart, color: 'text-white' },
    { id: 'boost', label: 'Boosts', icon: Zap, color: 'text-yellow-400' },
    { id: 'cosmetic', label: 'Cosmetics', icon: Sparkles, color: 'text-pink-400' },
    { id: 'feature', label: 'Features', icon: Star, color: 'text-purple-400' },
];

export function Shop() {
    const { user, profile, initialize } = useAuthStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [purchased, setPurchased] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<'all' | 'boost' | 'cosmetic' | 'feature'>('all');

    const handlePurchase = async (item: ShopItem) => {
        if (!user || !profile) return toast.error("Please login to access the store.");

        if (loading) return;
        setLoading(item.id);

        try {
            if ((profile.coins || 0) < item.price) {
                toast.error("Insufficient Credits!");
                return;
            }

            const newBalance = (profile.coins || 0) - item.price;

            // Temporary mock due to Appwrite migration
            // const userRef = doc(db, 'users', user.uid);
            // await updateDoc(userRef, {
            //     coins: newBalance
            // });

            // await initialize();

            setPurchased(prev => [...prev, item.id]);
            toast.success(`${item.name} purchased!`);

        } catch (error: any) {
            console.error("Purchase Error:", error);
            toast.error("Transaction failed: " + error.message);
        } finally {
            setLoading(null);
        }
    };

    const filteredItems = activeCategory === 'all' ? ITEMS : ITEMS.filter(i => i.category === activeCategory);

    return (
        <Layout>
            <div className="min-h-screen bg-black pt-16">
                {/* Hero Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-black to-black border-b border-purple-500/10">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>

                    <div className="container mx-auto px-6 py-16 relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                        <ShoppingCart className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter">
                                            Dev<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Store</span>
                                        </h1>
                                        <p className="text-gray-500 text-sm font-medium">Upgrade your developer experience</p>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Card */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-green-500/20">
                                        <Wallet className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase font-black text-gray-500 tracking-widest mb-1">Your Balance</span>
                                        <span className="block text-4xl font-black text-white font-mono">
                                            {profile?.coins?.toLocaleString() || 0}
                                            <span className="text-green-400 text-lg ml-2">CR</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-12">
                    {/* Categories */}
                    <div className="flex items-center gap-3 mb-10">
                        {CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                                    activeCategory === category.id
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
                                )}
                            >
                                <category.icon className={cn("w-4 h-4", activeCategory === category.id ? "text-white" : category.color)} />
                                {category.label}
                                <span className={cn(
                                    "ml-1 px-2 py-0.5 rounded-full text-xs font-black",
                                    activeCategory === category.id ? "bg-white/20" : "bg-white/5"
                                )}>
                                    {category.id === 'all' ? ITEMS.length : ITEMS.filter(i => i.category === category.id).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative"
                            >
                                {/* Badge */}
                                {item.badge && (
                                    <div className="absolute -top-2 -right-2 z-10 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider shadow-lg">
                                        {item.badge}
                                    </div>
                                )}

                                <div className="relative p-6 rounded-2xl bg-[#0d0d0d] border border-white/10 hover:border-purple-500/50 transition-all overflow-hidden h-full flex flex-col">
                                    {/* Gradient Background */}
                                    <div className={cn(
                                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                                        `bg-gradient-to-br ${item.gradient}`
                                    )}></div>

                                    {/* Icon */}
                                    <div className={cn(
                                        "relative w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300",
                                        item.gradient
                                    )}>
                                        <item.icon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 mb-4">
                                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-purple-400 transition-colors">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white font-mono">{item.price}</span>
                                            <span className="text-sm text-gray-500 font-bold">CR</span>
                                        </div>
                                        <Button
                                            onClick={() => handlePurchase(item)}
                                            disabled={loading === item.id || purchased.includes(item.id)}
                                            className={cn(
                                                "h-10 px-6 text-xs font-black uppercase tracking-widest transition-all",
                                                purchased.includes(item.id)
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                                                    : `bg-gradient-to-r ${item.gradient} text-white shadow-lg hover:shadow-xl`
                                            )}
                                        >
                                            {loading === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : purchased.includes(item.id) ? (
                                                <span className="flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4" /> Owned
                                                </span>
                                            ) : (
                                                'Purchase'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
