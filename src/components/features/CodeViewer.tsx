import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Play, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeViewerProps {
  code?: string;
  language?: string;
  filename?: string;
  onRun?: () => void;
}

const DEFAULT_CODE = `// No code snippet available for this project.`;

export function CodeViewer({ code = DEFAULT_CODE, language = 'tsx', filename = 'App.tsx', onRun }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    if (onRun) {
      onRun();
    } else {
      setRunning(true);
      setTimeout(() => setRunning(false), 1500);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-[#252526] pl-0 pr-2 border-b border-black/50 select-none">

        {/* Active Tab */}
        <div className="px-4 py-2.5 text-sm text-[#e8e8e8] bg-[#1e1e1e] flex items-center gap-2 border-r border-black/50 relative">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="font-mono text-xs opacity-70">{language}</span>
          <span>{filename}</span>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-neon-violet" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs transition-colors border border-green-600/50"
          >
            {running ? (
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-green-400 border-t-transparent animate-spin" /> Running</span>
            ) : (
              <span className="flex items-center gap-1"><Play className="w-3 h-3 fill-current" /> Run</span>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden relative group">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '20px',
            height: '100%',
            backgroundColor: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
          }}
          showLineNumbers={true}
          wrapLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Footer Status Bar */}
      <div className="bg-neon-violet/10 px-3 py-1 text-[10px] text-neon-violet flex justify-between items-center select-none">
        <span>TypeScript React</span>
        <span>UTF-8 • Ln {code.split('\n').length}, Col 1</span>
      </div>
    </div>
  );
}
