'use client';

import { useState } from 'react';
import { Globe, RefreshCw, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrowserViewProps {
  screenshots: { screenshot: string; url: string; timestamp: string }[];
}

export function BrowserView({ screenshots }: BrowserViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const latest = screenshots[screenshots.length - 1];

  const content = (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-[#0D0D14] px-4 py-2">
        <Globe size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted">浏览器</span>
        <div className="ml-2 flex-1 overflow-hidden">
          {latest?.url && (
            <div className="flex items-center gap-1.5 rounded bg-bg-tertiary px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="truncate text-xs text-text-muted">{latest.url}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="rounded p-1 text-text-muted hover:bg-bg-tertiary hover:text-text"
        >
          <Maximize2 size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#0A0A12] p-2">
        {latest?.screenshot ? (
          <img
            src={latest.screenshot.startsWith('data:') ? latest.screenshot : `data:image/png;base64,${latest.screenshot}`}
            alt="浏览器截图"
            className="w-full rounded border border-border/50"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Globe size={32} className="mx-auto mb-2 text-text-muted/30" />
              <p className="text-sm text-text-muted">等待浏览器截图...</p>
            </div>
          </div>
        )}
      </div>
      {screenshots.length > 1 && (
        <div className="flex items-center gap-1 border-t border-border bg-[#0D0D14] px-3 py-1.5">
          <RefreshCw size={10} className="text-text-muted" />
          <span className="text-xs text-text-muted">
            已更新 {screenshots.length} 次
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isFullscreen && content}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 p-6"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="mx-auto h-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
