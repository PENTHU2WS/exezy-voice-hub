import { useState, useEffect } from 'react';
import { auth } from '../lib/config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Loader2, Chrome, Mail, ArrowRight, Sparkles, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Firebase onAuthStateChanged in the store will update user state automatically.
            navigate('/');
        } catch (err: any) {
            console.error('Email auth error:', err);
            // Handling some common Firebase Auth errors
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already in use.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(err.message || 'An error occurred during authentication.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        alert(`${provider} login will be added soon! For now, please use Email/Password.`);
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 bg-black">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md p-10 rounded-3xl bg-[#0a0a0a] border border-purple-500/20 shadow-2xl shadow-purple-500/10 relative overflow-hidden"
                >

                    {/* Neon Glow Effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 text-center mb-10">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6"
                        >
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white mb-3 uppercase tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Join Exezy'}
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {isLogin ? 'Access your developer workspace' : 'Start building with the community'}
                        </p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, x: -10, height: 0 }}
                                className="mb-6 overflow-hidden"
                            >
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleEmailAuth} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-purple-400 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@exezy.io"
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-purple-400 uppercase tracking-widest">Password</label>
                                {isLogin && (
                                    <a href="#" className="text-xs text-purple-500 hover:text-purple-400 font-bold">Forgot?</a>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                                required
                            />
                        </div>

                        <Button
                            className="w-full h-12 text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/30 font-black uppercase tracking-widest text-xs rounded-xl"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-8 z-10">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                            <span className="bg-[#0a0a0a] px-3 text-gray-600">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full h-12 border-white/10 hover:bg-white/5 hover:border-purple-500/30 gap-3 rounded-xl font-bold relative z-10 mb-3"
                        disabled={loading}
                    >
                        <Chrome className="w-5 h-5 text-white" />
                        <span>Continue with Google</span>
                    </Button>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleSocialLogin('GitHub')}
                        className="w-full h-12 border-white/10 hover:bg-white/5 hover:border-purple-500/30 gap-3 rounded-xl font-bold relative z-10"
                        disabled={loading}
                    >
                        <Github className="w-5 h-5 text-white" />
                        <span>Continue with GitHub</span>
                    </Button>

                    <div className="mt-8 text-center text-sm text-gray-500 relative z-10">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-purple-400 font-black hover:text-purple-300 focus:outline-none uppercase tracking-wider"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>

                </motion.div>
            </div>
        </Layout>
    );
}
