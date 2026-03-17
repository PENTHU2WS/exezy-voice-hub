import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black text-gray-400">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">

                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4 text-white">
                            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold font-mono">
                                &lt;/&gt;
                            </div>
                            <span className="text-xl font-bold">Exezy</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6 max-w-xs">
                            The ultimate platform for developers to build, ship, and grow together.
                            Open source and community driven.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/explore" className="hover:text-neon-violet transition-colors">Explore</Link></li>
                            <li><Link to="/community" className="hover:text-neon-violet transition-colors">Community</Link></li>
                            <li><Link to="/docs" className="hover:text-neon-violet transition-colors">Documentation</Link></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Partners</a></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Brand Assets</a></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Help Center</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-neon-violet transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>

                    <div className="col-span-2 md:col-span-2 lg:col-span-1">
                        <div className="p-4 rounded-xl bg-dev-card border border-white/5">
                            <h4 className="font-bold text-white mb-2 text-sm">Status</h4>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-green-500 font-medium">All systems operational</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} Exezy Inc. All rights reserved.
                    </p>
                    <p className="text-sm flex items-center gap-1.5">
                        Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by
                        <span className="text-white font-medium">Exezy Team</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
