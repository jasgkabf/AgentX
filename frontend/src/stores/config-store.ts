import { create } from 'zustand';
import { LlmConfig, LlmProvider } from '@/types';

interface ConfigStore {
  configs: LlmConfig[];
  isLoading: boolean;
  editingConfig: LlmConfig | null;
  isModalOpen: boolean;

  setConfigs: (configs: LlmConfig[]) => void;
  setLoading: (loading: boolean) => void;
  setEditingConfig: (config: LlmConfig | null) => void;
  openModal: (config?: LlmConfig) => void;
  closeModal: () => void;
  addConfig: (config: LlmConfig) => void;
  updateConfig: (config: LlmConfig) => void;
  removeConfig: (id: string) => void;
  setDefaultConfig: (id: string) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  configs: [],
  isLoading: false,
  editingConfig: null,
  isModalOpen: false,

  setConfigs: (configs) => set({ configs }),

  setLoading: (loading) => set({ isLoading: loading }),

  setEditingConfig: (config) => set({ editingConfig: config }),

  openModal: (config) =>
    set({ isModalOpen: true, editingConfig: config || null }),

  closeModal: () =>
    set({ isModalOpen: false, editingConfig: null }),

  addConfig: (config) =>
    set((state) => ({ configs: [...state.configs, config] })),

  updateConfig: (config) =>
    set((state) => ({
      configs: state.configs.map((c) => (c.id === config.id ? config : c)),
    })),

  removeConfig: (id) =>
    set((state) => ({
      configs: state.configs.filter((c) => c.id !== id),
    })),

  setDefaultConfig: (id) =>
    set((state) => ({
      configs: state.configs.map((c) => ({
        ...c,
        isDefault: c.id === id,
      })),
    })),
}));

export const PROVIDER_OPTIONS: { value: LlmProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: '自定义' },
];
