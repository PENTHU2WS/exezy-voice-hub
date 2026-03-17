import { Layout } from '../components/layout/Layout';
import { Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const SIDEBAR_ITEMS = [
    { section: 'Introduction', items: ['Getting Started', 'What is Exezy?', 'Architecture'] },
    { section: 'Guides', items: ['Project Upload', 'Structure & ZIP', 'Live Preview'] },
    { section: 'Advanced', items: ['API Reference', 'CLI Tools', 'Deployment'] },
];

export function Docs() {
    return (
        <Layout>
            <div className="min-h-screen bg-dev-black border-t border-white/5">
                <div className="container mx-auto px-4 grid grid-cols-12 gap-8 py-8">

                    {/* Left Sidebar - Navigation */}
                    <aside className="hidden lg:block col-span-2 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto">
                        <div className="space-y-8">
                            {SIDEBAR_ITEMS.map((group) => (
                                <div key={group.section}>
                                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{group.section}</h4>
                                    <ul className="space-y-2 border-l border-white/5 ml-1">
                                        {group.items.map((item) => (
                                            <li key={item}>
                                                <Link
                                                    to="#"
                                                    className={cn(
                                                        "block pl-4 py-1 text-sm transition-colors border-l mb-[1px]",
                                                        item === 'Getting Started'
                                                            ? "text-neon-violet border-neon-violet -ml-[1px] font-medium"
                                                            : "text-gray-400 hover:text-white border-transparent hover:border-gray-500"
                                                    )}
                                                >
                                                    {item}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-12 lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl"
                        >
                            <div className="flex items-center gap-2 text-neon-violet mb-4 text-sm font-medium">
                                <Globe className="w-4 h-4" />
                                <span>Documentation</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Getting Started</h1>
                            <p className="text-xl text-gray-400 leading-relaxed mb-12">
                                Welcome to the comprehensive guide for Exezy. Learn how to integrate, deploy,
                                and scale your applications with our unified toolchain.
                            </p>

                            {/* Quick Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                <div className="p-6 rounded-xl bg-dev-card border border-white/5 hover:border-neon-violet/50 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-neon-violet/10 flex items-center justify-center text-neon-violet mb-4 group-hover:bg-neon-violet group-hover:text-white transition-colors">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-white mb-2">Quickstart</h3>
                                    <p className="text-sm text-gray-400">Deploy your first app in less than 2 minutes via CLI.</p>
                                </div>

                                <div className="p-6 rounded-xl bg-dev-card border border-white/5 hover:border-green-500/50 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-white mb-2">Security</h3>
                                    <p className="text-sm text-gray-400">Best practices for securing your API keys and data.</p>
                                </div>
                            </div>

                            {/* Installation Section */}
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
                                <p className="text-gray-400 mb-6">
                                    Install the global CLI to get access to all developer tools directly from your terminal.
                                </p>

                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-violet to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                    <div className="relative p-4 rounded-lg bg-black border border-white/10 font-mono text-sm text-gray-300 flex items-center">
                                        <span className="text-neon-violet mr-2">$</span>
                                        npm install -g @exezy/cli@latest
                                    </div>
                                </div>
                            </div>

                            {/* Configuration Section */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
                                <p className="text-gray-400 mb-6">
                                    Create a `devhub.config.js` file in your root directory to customize your deployment.
                                </p>
                                <div className="p-6 rounded-xl bg-[#1e1e1e] border border-white/5 overflow-hidden">
                                    <pre className="font-mono text-sm text-blue-300">
                                        {`module.exports = {
  project: 'my-awesome-app',
  region: 'us-east-1',
  framework: 'react',
  build: {
    command: 'npm run build',
    output: 'dist'
  }
}`}
                                    </pre>
                                </div>
                            </div>

                        </motion.div>
                    </main>

                    {/* Right Sidebar - TOC */}
                    <aside className="hidden xl:block col-span-2 sticky top-24 h-[calc(100vh-100px)]">
                        <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider text-gray-500">On this page</h4>
                        <ul className="space-y-3 text-sm border-l border-white/5 ml-1">
                            {['Introduction', 'Prerequisites', 'Installation', 'Configuration', 'Next Steps'].map((item, i) => (
                                <li key={item}>
                                    <a href="#" className={cn("block pl-4 border-l transition-colors -ml-[1px]", i === 0 ? "text-neon-violet border-neon-violet" : "text-gray-500 hover:text-white border-transparent")}>
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </aside>

                </div>
            </div>
        </Layout>
    );
}

function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}


