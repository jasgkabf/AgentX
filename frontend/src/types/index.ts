export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  steps?: TaskStep[];
  result?: string;
  error?: string;
}

export interface TaskStep {
  id: string;
  taskId: string;
  stepNumber: number;
  type: 'thinking' | 'action' | 'observation';
  content: string;
  action?: Action;
  observation?: ActionObservation;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
}

export interface Action {
  type: string;
  name: string;
  input: Record<string, unknown>;
  timestamp: string;
}

export interface ActionObservation {
  result: string;
  success: boolean;
  screenshot?: string;
  url?: string;
  terminalOutput?: string;
  files?: FileNode[];
  timestamp: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  size?: number;
  modifiedAt?: string;
}

export type LlmProvider = 'openai' | 'anthropic' | 'deepseek' | 'azure' | 'ollama' | 'custom';

export interface LlmConfig {
  id: string;
  provider: LlmProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLlmConfigRequest {
  provider: LlmProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface CreateTaskRequest {
  description: string;
  llmConfigId?: string;
}

export interface WebSocketEvents {
  onThinking: (data: { taskId: string; content: string; timestamp: string }) => void;
  onAction: (data: { taskId: string; action: Action; timestamp: string }) => void;
  onTerminal: (data: { taskId: string; output: string; timestamp: string }) => void;
  onBrowser: (data: { taskId: string; screenshot: string; url: string; timestamp: string }) => void;
  onStatus: (data: { taskId: string; status: TaskStatus; timestamp: string }) => void;
  onCompleted: (data: { taskId: string; result: string; tokenUsage: Task['tokenUsage']; timestamp: string }) => void;
  onFailed: (data: { taskId: string; error: string; timestamp: string }) => void;
}
