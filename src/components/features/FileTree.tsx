import { Folder, FileText, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface FileNode {
    name: string;
    type: 'folder' | 'file';
    children?: FileNode[];
    path?: string;
}

const FileItem = ({ item, depth = 0, onFileClick }: { item: FileNode; depth?: number; onFileClick?: (file: FileNode) => void }) => {
    const [isOpen, setIsOpen] = useState(depth < 1); // Open root level by default
    const isFolder = item.type === 'folder';

    const handleClick = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        } else {
            onFileClick?.(item);
        }
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 cursor-pointer text-xs transition-all duration-200 group select-none hover:bg-white/5",
                    item.type === 'file' ? "text-gray-400 hover:text-purple-400" : "text-gray-300 hover:text-white"
                )}
                onClick={handleClick}
                style={{ paddingLeft: `${depth * 16 + 16}px` }}
            >
                <div className="flex items-center gap-2">
                    {isFolder && (
                        <span className="text-gray-600 group-hover:text-purple-500 transition-colors">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                    )}

                    <span className="flex-shrink-0">
                        {isFolder ? (
                            isOpen ? <FolderOpen className="w-4 h-4 text-purple-500 fill-purple-500/10" /> : <Folder className="w-4 h-4 text-purple-500/60" />
                        ) : (
                            <FileText className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                        )}
                    </span>

                    <span className="truncate font-medium tracking-tight">
                        {item.name}
                    </span>
                </div>
            </div>

            {isFolder && isOpen && item.children && (
                <div className="relative">
                    {/* Optional: Vertical guide line */}
                    <div
                        className="absolute left-[23px] top-0 bottom-0 w-px bg-white/5 group-hover:bg-purple-500/20 transition-colors"
                        style={{ left: `${depth * 16 + 23}px` }}
                    />
                    {item.children.map((child, idx) => (
                        <FileItem key={`${child.name}-${idx}`} item={child} depth={depth + 1} onFileClick={onFileClick} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface FileTreeProps {
    files: FileNode[];
    onFileClick?: (file: FileNode) => void;
}

export function FileTree({ files, onFileClick }: FileTreeProps) {
    return (
        <div className="h-full bg-black/20 flex flex-col">
            <div className="px-4 py-3 border-b border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Source Code</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-purple-500/20">
                {files.length === 0 ? (
                    <div className="p-8 text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest flex flex-col items-center gap-4">
                        <div className="w-10 h-px bg-white/5" />
                        No File Entries
                        <div className="w-10 h-px bg-white/5" />
                    </div>
                ) : (
                    files.map((file, idx) => (
                        <FileItem key={`${file.name}-${idx}`} item={file} onFileClick={onFileClick} />
                    ))
                )}
            </div>
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Stream</span>
                </div>
            </div>
        </div>
    );
}
