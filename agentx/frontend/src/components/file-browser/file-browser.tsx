'use client';

import { useState } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  FileCode,
  FileText,
  Image,
} from 'lucide-react';
import { FileNode } from '@/types';
import { cn } from '@/components/ui/button';

interface FileBrowserProps {
  files: FileNode[];
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java'].includes(ext)) {
    return <FileCode size={14} className="text-accent" />;
  }
  if (['md', 'txt', 'log'].includes(ext)) {
    return <FileText size={14} className="text-text-muted" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image size={14} className="text-warning" />;
  }
  return <File size={14} className="text-text-muted" />;
}

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isDir = node.type === 'directory';

  return (
    <div>
      <button
        onClick={() => isDir && setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-bg-tertiary',
          isDir && 'text-text',
          !isDir && 'text-text-secondary'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <>
            <ChevronRight
              size={12}
              className={cn(
                'shrink-0 text-text-muted transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
            <Folder
              size={14}
              className={cn(
                'shrink-0',
                isExpanded ? 'text-accent' : 'text-text-muted'
              )}
            />
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileBrowser({ files }: FileBrowserProps) {
  if (!files || files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-bg-secondary p-4">
        <div className="text-center">
          <Folder size={32} className="mx-auto mb-2 text-text-muted/30" />
          <p className="text-sm text-text-muted">暂无文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-border bg-bg-secondary p-2">
      <div className="mb-2 flex items-center gap-2 border-b border-border px-2 pb-2">
        <Folder size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted">文件浏览器</span>
      </div>
      {files.map((node) => (
        <FileTreeNode key={node.path} node={node} />
      ))}
    </div>
  );
}
