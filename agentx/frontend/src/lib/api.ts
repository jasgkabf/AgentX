import { CreateTaskRequest, CreateLlmConfigRequest, Task, LlmConfig } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `请求失败: ${res.status}`);
  }

  return res.json();
}

function get<T>(url: string): Promise<T> {
  return request<T>(url);
}

function post<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
}

function put<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
}

function del<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' });
}

export const api = {
  tasks: {
    create: (data: CreateTaskRequest) => post<Task>('/api/tasks', data),
    list: () => get<Task[]>('/api/tasks'),
    get: (id: string) => get<Task>(`/api/tasks/${id}`),
    cancel: (id: string) => post<Task>(`/api/tasks/${id}/cancel`),
    retry: (id: string) => post<Task>(`/api/tasks/${id}/retry`),
  },
  llmConfigs: {
    create: (data: CreateLlmConfigRequest) => post<LlmConfig>('/api/llm-configs', data),
    list: () => get<LlmConfig[]>('/api/llm-configs'),
    get: (id: string) => get<LlmConfig>(`/api/llm-configs/${id}`),
    update: (id: string, data: Partial<CreateLlmConfigRequest>) => put<LlmConfig>(`/api/llm-configs/${id}`, data),
    delete: (id: string) => del<void>(`/api/llm-configs/${id}`),
    setDefault: (id: string) => post<LlmConfig>(`/api/llm-configs/${id}/set-default`),
  },
};
