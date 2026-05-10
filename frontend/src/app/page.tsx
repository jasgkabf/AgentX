'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  MessageSquare,
  Settings,
  ListTodo,
  Bot,
  Loader2,
  StopCircle,
  RotateCcw,
} from 'lucide-react';
import { useTaskStore } from '@/stores/task-store';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { Task, TaskStatus } from '@/types';
import { Button, cn } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskInput } from '@/components/chat/task-input';
import { ThinkingPanel } from '@/components/chat/thinking-panel';
import { ActionPanel } from '@/components/chat/action-panel';
import { StepTimeline } from '@/components/chat/step-timeline';
import { TerminalView } from '@/components/terminal/terminal-view';
import { BrowserView } from '@/components/browser/browser-view';

type RightTab = 'browser' | 'terminal' | 'files';

export default function HomePage() {
  const router = useRouter();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>('browser');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    tasks,
    currentTask,
    thinking,
    actions,
    steps,
    terminalOutput,
    browserScreenshots,
    status,
    isLoading,
    setTasks,
    setCurrentTask,
    addThinking,
    addAction,
    addStep,
    addTerminalOutput,
    addBrowserScreenshot,
    setStatus,
    clearCurrentTask,
    setLoading,
    updateTaskInList,
  } = useTaskStore();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [thinking, actions, steps, scrollToBottom]);

  useEffect(() => {
    api.tasks.list().then(setTasks).catch(console.error);
  }, [setTasks]);

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  useEffect(() => {
    if (!currentTask) return;

    const taskId = currentTask.id;
    wsClient.subscribeTask(taskId, {
      onThinking: (data) => {
        addThinking(data.content);
        addStep({
          id: `thinking-${Date.now()}`,
          taskId,
          stepNumber: steps.length + 1,
          type: 'thinking',
          content: data.content,
          timestamp: data.timestamp,
          status: 'completed',
        });
      },
      onAction: (data) => {
        addAction(data.action);
        addStep({
          id: `action-${Date.now()}`,
          taskId,
          stepNumber: steps.length + 1,
          type: 'action',
          content: `${data.action.name}: ${JSON.stringify(data.action.input)}`,
          action: data.action,
          timestamp: data.timestamp,
          status: 'running',
        });
      },
      onTerminal: (data) => {
        addTerminalOutput(data.output);
      },
      onBrowser: (data) => {
        addBrowserScreenshot(data.screenshot, data.url, data.timestamp);
      },
      onStatus: (data) => {
        setStatus(data.status);
        if (currentTask) {
          updateTaskInList({ ...currentTask, status: data.status });
        }
      },
      onCompleted: (data) => {
        setStatus('completed');
        if (currentTask) {
          updateTaskInList({ ...currentTask, status: 'completed', result: data.result, tokenUsage: data.tokenUsage });
        }
        setLoading(false);
      },
      onFailed: (data) => {
        setStatus('failed');
        if (currentTask) {
          updateTaskInList({ ...currentTask, status: 'failed', error: data.error });
        }
        setLoading(false);
      },
    });

    return () => wsClient.unsubscribeTask(taskId);
  }, [currentTask?.id]);

  const handleCreateTask = useCallback(
    async (description: string) => {
      if (isLoading) return;
      try {
        setLoading(true);
        if (currentTask && (status === 'running' || status === 'pending')) {
          return;
        }
        clearCurrentTask();
        const task = await api.tasks.create({ description });
        setCurrentTask(task);
        setStatus('running');
        setTasks([task, ...tasks]);
      } catch (err) {
        console.error('创建任务失败:', err);
        setLoading(false);
      }
    },
    [tasks, currentTask, status, isLoading, clearCurrentTask, setCurrentTask, setStatus, setLoading, setTasks]
  );

  const handleNewChat = useCallback(() => {
    clearCurrentTask();
  }, [clearCurrentTask]);

  const handleCancelTask = useCallback(async () => {
    if (!currentTask) return;
    try {
      await api.tasks.cancel(currentTask.id);
      setStatus('cancelled');
      setLoading(false);
    } catch (err) {
      console.error('取消任务失败:', err);
    }
  }, [currentTask, setStatus, setLoading]);

  const handleRetryTask = useCallback(async () => {
    if (!currentTask) return;
    try {
      setLoading(true);
      clearCurrentTask();
      const task = await api.tasks.retry(currentTask.id);
      setCurrentTask(task);
      setStatus('running');
    } catch (err) {
      console.error('重试任务失败:', err);
      setLoading(false);
    }
  }, [currentTask, clearCurrentTask, setCurrentTask, setStatus, setLoading]);

  const handleSelectTask = useCallback(
    async (task: Task) => {
      clearCurrentTask();
      try {
        const fullTask = await api.tasks.get(task.id);
        setCurrentTask(fullTask);
        setStatus(fullTask.status);
        if (fullTask.steps) {
          fullTask.steps.forEach((step) => addStep(step));
        }
      } catch (err) {
        console.error('获取任务详情失败:', err);
      }
    },
    [clearCurrentTask, setCurrentTask, setStatus, addStep]
  );

  const statusLabel: Record<TaskStatus, string> = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Left Sidebar */}
      <AnimatePresence mode="wait">
        {!leftCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex shrink-0 flex-col border-r border-border bg-bg-secondary"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-accent" />
                <span className="font-semibold text-text">AgentX</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/tasks')}
                  title="任务管理"
                >
                  <ListTodo size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  title="设置"
                >
                  <Settings size={16} />
                </Button>
              </div>
            </div>

            <div className="p-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleNewChat}
              >
                <Plus size={14} />
                新对话
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-text-muted">历史任务</p>
              {tasks.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-text-muted">暂无任务</p>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={cn(
                      'mb-1 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                      currentTask?.id === task.id
                        ? 'bg-accent/10 text-text'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text'
                    )}
                  >
                    <MessageSquare size={14} className="mt-0.5 shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{task.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge status={task.status} />
                        <span className="text-xs text-text-muted">
                          {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Buttons */}
      <div className="flex flex-col border-r border-border/50 bg-bg py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="mx-auto"
          title={leftCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {leftCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-6 py-3">
          <div className="flex items-center gap-3">
            {currentTask ? (
              <>
                <h1 className="text-sm font-medium text-text truncate max-w-md">
                  {currentTask.description}
                </h1>
                <Badge status={status || currentTask.status} />
              </>
            ) : (
              <h1 className="text-sm font-medium text-text-muted">选择或创建一个任务开始</h1>
            )}
          </div>
          {currentTask && (status === 'running' || isLoading) && (
            <Button variant="danger" size="sm" onClick={handleCancelTask}>
              <StopCircle size={14} />
              取消
            </Button>
          )}
          {currentTask && (status === 'failed' || status === 'cancelled') && (
            <Button variant="secondary" size="sm" onClick={handleRetryTask}>
              <RotateCcw size={14} />
              重试
            </Button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentTask ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Bot size={48} className="mx-auto mb-4 text-accent/30" />
                <h2 className="mb-2 text-xl font-semibold text-text">AgentX 智能体控制台</h2>
                <p className="mb-6 text-sm text-text-muted">描述你想让智能体完成的任务，它将自主执行</p>
                <div className="mx-auto max-w-md space-y-2">
                  {[
                    '帮我分析这个网站的 SEO 优化建议',
                    '创建一个 React 组件库项目',
                    '搜索最新的 AI 技术趋势并生成报告',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => handleCreateTask(example)}
                      className="block w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-4 p-6">
              {/* Step Timeline */}
              {steps.length > 0 && <StepTimeline steps={steps} />}

              {/* Thinking Panels */}
              {thinking.map((content, i) => (
                <ThinkingPanel key={i} content={content} />
              ))}

              {/* Action Panels */}
              {actions.map((action, i) => (
                <ActionPanel
                  key={i}
                  action={`${action.name}(${JSON.stringify(action.input, null, 2)})`}
                />
              ))}

              {/* Running Indicator */}
              {(status === 'running' || isLoading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-accent"
                >
                  <Loader2 size={14} className="animate-spin" />
                  <span>智能体正在执行任务...</span>
                </motion.div>
              )}

              {/* Completed Result */}
              {status === 'completed' && currentTask?.result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-success/20 bg-success/5 p-4"
                >
                  <p className="text-sm font-medium text-success mb-1">任务完成</p>
                  <p className="text-sm text-text-secondary">{currentTask.result}</p>
                </motion.div>
              )}

              {/* Failed Result */}
              {status === 'failed' && currentTask?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-error/20 bg-error/5 p-4"
                >
                  <p className="text-sm font-medium text-error mb-1">任务失败</p>
                  <p className="text-sm text-text-secondary">{currentTask.error}</p>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <TaskInput
          onSubmit={handleCreateTask}
          isLoading={isLoading || status === 'running'}
          placeholder={
            status === 'running'
              ? '智能体正在执行中，请等待...'
              : currentTask && (status === 'completed' || status === 'failed' || status === 'cancelled')
              ? '输入新的指令继续...'
              : '描述你想让智能体完成的任务...'
          }
        />
      </div>

      {/* Right Panel Toggle */}
      <div className="flex flex-col border-l border-border/50 bg-bg py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightCollapsed(!rightCollapsed)}
          className="mx-auto"
          title={rightCollapsed ? '展开详情面板' : '收起详情面板'}
        >
          {rightCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </Button>
      </div>

      {/* Right Panel */}
      <AnimatePresence mode="wait">
        {!rightCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex shrink-0 flex-col border-l border-border bg-bg-secondary"
          >
            <div className="flex border-b border-border">
              {(['browser', 'terminal', 'files'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={cn(
                    'flex-1 px-3 py-2.5 text-xs font-medium transition-colors',
                    rightTab === tab
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-text-muted hover:text-text'
                  )}
                >
                  {tab === 'browser' ? '浏览器' : tab === 'terminal' ? '终端' : '文件'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden p-3">
              {rightTab === 'browser' && <BrowserView screenshots={browserScreenshots} />}
              {rightTab === 'terminal' && <TerminalView output={terminalOutput} />}
              {rightTab === 'files' && (
                <div className="h-full">
                  <p className="text-xs text-text-muted text-center py-8">文件浏览器将在任务执行时显示</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
