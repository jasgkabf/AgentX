'use client';

import { cn } from './button';
import { TaskStatus } from '@/types';

interface BadgeProps {
  status: TaskStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: '等待中',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  running: {
    label: '运行中',
    className: 'bg-accent/10 text-accent border-accent/20',
  },
  completed: {
    label: '已完成',
    className: 'bg-success/10 text-success border-success/20',
  },
  failed: {
    label: '失败',
    className: 'bg-error/10 text-error border-error/20',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  },
};

export function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-bg-tertiary text-text-secondary border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        status === 'running' && 'animate-pulse-slow',
        className
      )}
    >
      {status === 'running' && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
