'use client';

import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, XCircle } from 'lucide-react';

interface ActionPanelProps {
  action: string;
  result?: string;
  success?: boolean;
  timestamp?: string;
}

export function ActionPanel({ action, result, success, timestamp }: ActionPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-lg border border-border"
    >
      <div className="flex items-center gap-2 bg-[#0D0D14] px-4 py-2.5">
        <Terminal size={14} className="text-success" />
        <span className="text-xs font-medium text-success">执行动作</span>
        {success !== undefined && (
          <span className="ml-auto">
            {success ? (
              <CheckCircle2 size={14} className="text-success" />
            ) : (
              <XCircle size={14} className="text-error" />
            )}
          </span>
        )}
        {timestamp && (
          <span className="text-xs text-text-muted">
            {new Date(timestamp).toLocaleTimeString('zh-CN')}
          </span>
        )}
      </div>
      <div className="bg-[#0A0A12] px-4 py-3">
        <pre className="whitespace-pre-wrap font-mono text-sm text-success/90">{action}</pre>
        {result && (
          <div className="mt-2 border-t border-border/50 pt-2">
            <p className="font-mono text-xs text-text-muted whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
