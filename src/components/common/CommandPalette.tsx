import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, User, FileText, Plus, Home, Zap, Loader2, Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { Project } from "../../types";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Debounced Search
    useEffect(() => {
        if (!search || search.length < 2) {
            setProjects([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const { data } = await supabase
                .from('projects')
                .select('*')
                .ilike('title', `%${search}%`)
                .limit(5);

            if (data) setProjects(data as Project[]);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <div className="fixed inset-0 z-[99999] pointer-events-none flex items-center justify-center">
            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                    onClick={() => setOpen(false)}
                />
            )}

            <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                label="Global Command Menu"
                className={`
           fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
           w-full max-w-lg 
           bg-[#0a0a0a] 
           border border-white/10 
           rounded-xl shadow-2xl shadow-neon-violet/20 
           overflow-hidden
           pointer-events-auto
           transition-all duration-200
           ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
            >
                <div className="flex items-center border-b border-white/5 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-white" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Type a command or search projects..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 text-white"
                    />
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-neon-violet ml-2" />}
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                        {search.length > 0 ? "No results found." : "Type to search..."}
                    </Command.Empty>

                    {/* Dynamic Search Results */}
                    {projects.length > 0 && (
                        <Command.Group heading="Projects" className="text-gray-500 text-xs font-medium px-2 py-1.5 uppercase">
                            {projects.map(p => (
                                <Command.Item
                                    key={p.id}
                                    onSelect={() => runCommand(() => navigate(`/project/${p.id}`))}
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                                >
                                    <Code2 className="mr-2 h-4 w-4" />
                                    <span>{p.title}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="General" className="text-gray-500 text-xs font-medium px-2 py-1.5 uppercase">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/explore'))}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            <span>Explore Projects</span>
                        </Command.Item>
                    </Command.Group>

                    {user && (
                        <Command.Group heading="User" className="text-gray-500 text-xs font-medium px-2 py-1.5 mt-2 uppercase">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/profile'))}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/upload'))}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span>New Project</span>
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="System" className="text-gray-500 text-xs font-medium px-2 py-1.5 mt-2 uppercase">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/docs'))}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-white/10 aria-selected:text-white"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Documentation</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>

                <div className="border-t border-white/5 py-2 px-4 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Navigation</span>
                    <span className="flex items-center gap-1">
                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">↑</kbd>
                        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">↓</kbd>
                        <span>to navigate</span>
                    </span>
                </div>
            </Command.Dialog>
        </div>
    );
}
