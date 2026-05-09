'use client';

import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalViewProps {
  output: string[];
}

export function TerminalView({ output }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-[#0D0D14] px-4 py-2">
        <TerminalIcon size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted">终端输出</span>
        <div className="ml-auto flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto bg-[#0A0A12] p-4 font-mono text-xs leading-relaxed"
      >
        {output.length === 0 ? (
          <span className="text-text-muted">等待终端输出...</span>
        ) : (
          output.map((line, i) => (
            <div key={i} className="text-success/80">
              <span className="mr-2 text-text-muted/50 select-none">{String(i + 1).padStart(3)}</span>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
