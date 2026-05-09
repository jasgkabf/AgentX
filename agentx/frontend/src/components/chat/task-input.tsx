'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function TaskInput({ onSubmit, isLoading = false, placeholder = '描述你想让智能体完成的任务...' }: TaskInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t border-border bg-bg-secondary p-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative flex items-end gap-3 rounded-xl border border-border bg-bg-tertiary p-2 transition-colors focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none disabled:opacity-50"
          />
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            size="sm"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden sm:inline">{isLoading ? '执行中' : '发送'}</span>
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-text-muted">
          按 Ctrl+Enter 发送任务
        </p>
      </div>
    </div>
  );
}
