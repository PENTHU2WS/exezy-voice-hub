import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { Loader2, Chrome, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: email.split('@')[0],
                        }
                    }
                });
                if (error) throw error;
                // For Supabase, check email confirmation? 
                // We'll assume auto-confirm or just redirect
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <div className="w-full max-w-md p-8 rounded-2xl bg-dev-card border border-white/10 shadow-2xl relative overflow-hidden">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Join the Hub'}
                        </h1>
                        <p className="text-gray-400">
                            {isLogin ? 'Enter your credentials to access your account' : 'Start your journey with us today'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full h-10 bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-violet transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                {isLogin && (
                                    <a href="#" className="text-xs text-neon-violet hover:text-neon-violet/80">Forgot password?</a>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-10 bg-black/50 border border-white/10 rounded-lg px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-violet transition-colors"
                                required
                            />
                        </div>

                        <Button
                            className="w-full h-10 text-white bg-neon-violet hover:bg-neon-violet/90 shadow-lg shadow-neon-violet/20"
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

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-dev-card px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="w-full h-10 border-white/10 hover:bg-white/5 gap-2"
                        disabled={loading}
                    >
                        <Chrome className="w-4 h-4 text-white" />
                        <span>Google</span>
                    </Button>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-white font-medium hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
