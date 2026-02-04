import { Heart, MessageSquare } from 'lucide-react';
import { Project } from '../../types';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProjectCardProps {
    project: Project;
    className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl bg-dev-card border border-white/5 transition-all",
                "hover:border-neon-violet/30 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]",
                className
            )}
        >
            {/* Image Section */}
            <Link to={`/project/${project.id}`} className="aspect-video w-full overflow-hidden bg-white/5 relative block">
                <img
                    src={project.image_url}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white font-medium text-sm">
                        View Details
                    </span>
                </div>
            </Link>

            {/* Content Section */}
            <div className="flex flex-col gap-3 p-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-neon-violet">{project.tags[0]}</span>
                        <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-neon-violet transition-colors">
                        <Link to={`/project/${project.id}`}>
                            {project.title}
                        </Link>
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                        {project.description}
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{project.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>12</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-[-8px]">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-neon-violet to-purple-500" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
