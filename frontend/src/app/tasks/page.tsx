'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Zap,
  Bot,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Task, TaskStatus } from '@/types';
import { Button, cn } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const statusFilters: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'running', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.tasks
      .list()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch =
      !search || task.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTokenUsage = (total?: number) => {
    if (!total) return '-';
    if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
    return String(total);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft size={16} />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-text">任务管理</h1>
                <p className="text-sm text-text-muted">查看和管理所有智能体任务</p>
              </div>
            </div>
            <Button onClick={() => router.push('/')}>
              <Plus size={14} />
              新建任务
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            {statusFilters.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === s.value
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:bg-bg-tertiary hover:text-text'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任务..."
              className="w-full rounded-lg border border-border bg-bg-tertiary py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 sm:w-64"
            />
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Bot size={32} className="animate-pulse text-accent/30" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bot size={48} className="mb-4 text-text-muted/30" />
            <p className="text-sm text-text-muted">
              {filter === 'all' ? '暂无任务' : `没有${statusFilters.find((s) => s.value === filter)?.label}的任务`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  hover
                  className="cursor-pointer"
                  onClick={() => router.push(`/?task=${task.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{task.description}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <Badge status={task.status} />
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={12} />
                          {new Date(task.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {task.tokenUsage && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Zap size={12} />
                            {formatTokenUsage(task.tokenUsage.total)} tokens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
