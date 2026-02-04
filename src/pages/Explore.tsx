import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ProjectCard } from '../components/features/ProjectCard';
import { Project } from '../types';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function Explore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

      if (activeCategory !== 'All') {
        query = query.contains('tags', [activeCategory]);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Fetch Error:", error);
        setProjects([]);
      } else {
        setProjects((data as Project[]) || []);
      }
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Discover Greatness</h1>
            <p className="text-gray-400 max-w-xl">
              Explore thousands of open-source projects built by the community.
              Fork, contribute, and learn.
            </p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2 bg-dev-card border border-white/10 p-1.5 rounded-lg">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white pl-9 pr-4 py-2 focus:outline-none placeholder:text-gray-600"
              />
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {['All', 'React', 'Next.js', 'Typescript', 'AI', 'Rust', 'Design'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCategory === cat
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p>Henüz içerik yok</p>
            <Button variant="ghost" className="mt-4 gap-2 text-neon-violet" onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}>
              <RefreshCw className="w-4 h-4" /> Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
