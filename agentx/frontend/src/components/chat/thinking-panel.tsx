'use client';

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ThinkingPanelProps {
  content: string;
  timestamp?: string;
}

export function ThinkingPanel({ content, timestamp }: ThinkingPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border-l-2 border-l-accent bg-accent/5 p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb size={14} className="text-accent" />
        <span className="text-xs font-medium text-accent">思考过程</span>
        {timestamp && (
          <span className="ml-auto text-xs text-text-muted">
            {new Date(timestamp).toLocaleTimeString('zh-CN')}
          </span>
        )}
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-text-secondary [&_p]:text-text-secondary [&_li]:text-text-secondary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </motion.div>
  );
}
