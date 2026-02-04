import { Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LanguageStatsProps {
    isAnalyzing: boolean;
    stats: { name: string; percent: number; color: string; }[];
}

export function LanguageStats({ isAnalyzing, stats }: LanguageStatsProps) {
    if (isAnalyzing) {
        return (
            <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-purple-500/20 flex flex-col items-center justify-center gap-4 min-h-[160px]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] animate-pulse">Analyzing DNA...</p>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Language DNA</h3>
                </div>
                <div className="relative group/tooltip">
                    <Info className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors cursor-help" />
                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-gray-400 font-medium invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-all z-50 shadow-2xl pointer-events-none">
                        Language DNA, projenin kod yoğunluğunu analiz eder.
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex w-full h-3 rounded-full overflow-hidden mb-6 bg-white/5 p-0.5 border border-white/5">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.name}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percent}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{ backgroundColor: stat.color }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: stat.color }} />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider group-hover/item:text-gray-300 transition-colors">{stat.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/80">{stat.percent}%</span>
                    </div>
                ))}
            </div>

            {stats.length === 0 && (
                <div className="text-center py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    No Data Found
                </div>
            )}
        </div>
    );
}
