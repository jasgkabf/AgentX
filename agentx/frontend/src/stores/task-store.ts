import { create } from 'zustand';
import { Task, TaskStep, TaskStatus, Action } from '@/types';

interface TaskStore {
  tasks: Task[];
  currentTask: Task | null;
  thinking: string[];
  actions: Action[];
  steps: TaskStep[];
  terminalOutput: string[];
  browserScreenshots: { screenshot: string; url: string; timestamp: string }[];
  status: TaskStatus | '';
  isLoading: boolean;

  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  addThinking: (content: string) => void;
  addAction: (action: Action) => void;
  addStep: (step: TaskStep) => void;
  addTerminalOutput: (data: string) => void;
  addBrowserScreenshot: (screenshot: string, url: string, timestamp: string) => void;
  setStatus: (status: TaskStatus) => void;
  clearCurrentTask: () => void;
  setLoading: (loading: boolean) => void;
  updateTaskInList: (task: Task) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  currentTask: null,
  thinking: [],
  actions: [],
  steps: [],
  terminalOutput: [],
  browserScreenshots: [],
  status: '',
  isLoading: false,

  setTasks: (tasks) => set({ tasks }),

  setCurrentTask: (task) => set({ currentTask: task }),

  addThinking: (content) =>
    set((state) => ({ thinking: [...state.thinking, content] })),

  addAction: (action) =>
    set((state) => ({ actions: [...state.actions, action] })),

  addStep: (step) =>
    set((state) => ({ steps: [...state.steps, step] })),

  addTerminalOutput: (data) =>
    set((state) => ({ terminalOutput: [...state.terminalOutput, data] })),

  addBrowserScreenshot: (screenshot, url, timestamp) =>
    set((state) => ({
      browserScreenshots: [...state.browserScreenshots, { screenshot, url, timestamp }],
    })),

  setStatus: (status) => set({ status }),

  clearCurrentTask: () =>
    set({
      currentTask: null,
      thinking: [],
      actions: [],
      steps: [],
      terminalOutput: [],
      browserScreenshots: [],
      status: '',
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  updateTaskInList: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    })),
}));
