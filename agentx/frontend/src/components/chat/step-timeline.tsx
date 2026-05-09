'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ChevronDown,
  Brain,
  Terminal,
  Eye,
} from 'lucide-react';
import { TaskStep } from '@/types';
import { cn } from '@/components/ui/button';

interface StepTimelineProps {
  steps: TaskStep[];
}

const stepIcons: Record<string, React.ReactNode> = {
  thinking: <Brain size={14} />,
  action: <Terminal size={14} />,
  observation: <Eye size={14} />,
};

const stepColors: Record<string, string> = {
  thinking: 'text-accent bg-accent/10 border-accent/30',
  action: 'text-success bg-success/10 border-success/30',
  observation: 'text-warning bg-warning/10 border-warning/30',
};

function StatusIcon({ status }: { status: TaskStep['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 size={12} className="animate-spin text-accent" />;
    case 'completed':
      return <CheckCircle2 size={12} className="text-success" />;
    case 'failed':
      return <XCircle size={12} className="text-error" />;
    default:
      return <Circle size={12} className="text-text-muted" />;
  }
}

export function StepTimeline({ steps }: StepTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  if (steps.length === 0) return null;

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isExpanded = expandedSteps.has(step.id);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <button
                onClick={() => toggleStep(step.id)}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                  stepColors[step.type]
                )}
              >
                {stepIcons[step.type]}
              </button>
              {!isLast && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>
            <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
              <button
                onClick={() => toggleStep(step.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium text-text-muted">
                    #{step.stepNumber}
                  </span>
                  <span className={cn(
                    'text-sm font-medium capitalize',
                    step.type === 'thinking' && 'text-accent',
                    step.type === 'action' && 'text-success',
                    step.type === 'observation' && 'text-warning'
                  )}>
                    {step.type === 'thinking' ? '思考' : step.type === 'action' ? '动作' : '观察'}
                  </span>
                  <StatusIcon status={step.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {new Date(step.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-text-muted transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-lg bg-bg-tertiary p-3 text-sm text-text-secondary">
                      {step.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
