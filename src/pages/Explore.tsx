import { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ProjectCard } from '../components/features/ProjectCard';
import { Project } from '../types';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { cn } from '../lib/utils';
// import { db } from '../lib/config';
// import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { motion } from 'framer-motion';

export function Explore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    // Mock fetch
    setProjects([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [activeCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = ['All', 'React', 'Vue', 'Node.js', 'Python', 'AI/ML', 'Game Dev'];

  return (
    <Layout>
      <div className="min-h-screen bg-black pt-16">
        {/* Header */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">
                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Projects</span>
              </h1>
              <p className="text-gray-500 font-medium">Discover amazing projects from the community</p>
            </div>

            <Button
              onClick={fetchProjects}
              variant="outline"
              className="gap-2 border-purple-500/30 hover:bg-purple-500/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[#0d0d0d] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
            <Button variant="outline" className="gap-2 h-12 px-6 border-white/10 hover:bg-white/5">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <span className="text-sm text-gray-500 uppercase font-black tracking-widest">Loading Projects...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-30">
              <Search className="w-20 h-20 text-gray-700" />
              <div className="text-center">
                <span className="block text-2xl text-gray-600 uppercase font-black tracking-widest mb-2">
                  {searchQuery ? 'No Results Found' : 'No Projects Yet'}
                </span>
                <p className="text-sm text-gray-700">
                  {searchQuery
                    ? `No projects match "${searchQuery}"`
                    : 'Be the first to upload a project!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
