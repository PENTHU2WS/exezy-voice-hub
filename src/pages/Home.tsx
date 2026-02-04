import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { ArrowRight, Code, Zap, Globe, Shield, Cpu, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Home() {
    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden pt-20">

                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-neon-violet/20 rounded-full blur-[120px] opacity-30 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-900/20 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neon-violet mb-8 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-neon-violet"></span>
                            v1.0 is now live
                        </div>

                        <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 tracking-tight mb-6 leading-tight">
                            Build Faster,<br />
                            <span className="text-neon-violet">Ship Better.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
                            The ultimate platform for developers to showcase projects,
                            find collaborators, and accelerate growth.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/explore">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2 shadow-[0_0_30px_-10px_rgba(139,92,246,0.5)]">
                                    Start Exploring <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/docs">
                                <Button variant="secondary" size="lg" className="h-14 px-8 text-lg">
                                    Read Documentation
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
            </section>

            {/* Projects of the Week Section */}
            <section className="py-24 bg-black relative border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2">Projects of the Week</h2>
                            <p className="text-gray-400">Hand-picked by our editors for their innovation.</p>
                        </div>
                        <Link to="/explore">
                            <Button variant="ghost" className="gap-2 text-neon-violet hover:text-white hover:bg-neon-violet/10">
                                View All <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Featured Project (Big) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="md:col-span-2 lg:col-span-2 group relative rounded-2xl overflow-hidden aspect-video md:aspect-auto md:h-[500px] border border-white/10"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
                                alt="Featured"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 rounded-full bg-neon-violet text-white text-xs font-bold uppercase tracking-wider">
                                        Featured
                                    </span>
                                    <span className="text-sm font-medium text-gray-300">@alex_dev</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">Neon Database UI</h3>
                                <p className="text-gray-300 max-w-xl mb-6 line-clamp-2 text-lg">
                                    A futuristic database management interface built with Next.js 14, Framer Motion, and Tailwind CSS.
                                    Features real-time data visualization and SQL editor.
                                </p>
                                <Link to="/project/1">
                                    <Button className="bg-white text-black hover:bg-gray-200 border-none">
                                        View Project
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Sub Projects (Small) */}
                        <div className="flex flex-col gap-6 h-full">
                            {[
                                { title: "AI Code Assistant", author: "@sarah_ai", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop" },
                                { title: "3D Portfolio Portfolio", author: "@mike_3d", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex-1 group relative rounded-2xl overflow-hidden border border-white/10 min-h-[200px]"
                                >
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                    <div className="absolute bottom-0 left-0 p-5">
                                        <h4 className="text-xl font-bold text-white mb-1 group-hover:text-neon-violet transition-colors">{item.title}</h4>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-400">{item.author}</p>
                                            <ArrowRight className="w-4 h-4 text-white -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-dev-black relative border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            A complete toolkit tailored for developers who want to speed up their workflow.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Zap, title: "Lightning Fast", desc: "Built on Vite and Supabase for minimal latency and maximum performance." },
                            { icon: Code, title: "Modern Stack", desc: "React 18, TypeScript, and Tailwind CSS ready to go out of the box." },
                            { icon: Globe, title: "Global CDN", desc: "Deploy your assets to the edge with a single click." },
                            { icon: Shield, title: "Secure by Default", desc: "Enterprise-grade security with Supabase Auth and RLS policies." },
                            { icon: Layers, title: "Scalable Architecture", desc: "Designed to grow with your project from day one." },
                            { icon: Cpu, title: "AI Powered", desc: "Integrated AI tools to help you write better code faster." }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-2xl bg-dev-card border border-white/5 hover:border-white/10 transition-colors hover:bg-white/[0.02]"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-neon-violet group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 group-hover:text-neon-violet transition-colors">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
