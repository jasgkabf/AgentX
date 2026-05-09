'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Star,
  Key,
  Server,
  Bot,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useConfigStore, PROVIDER_OPTIONS } from '@/stores/config-store';
import { LlmConfig, LlmProvider, CreateLlmConfigRequest } from '@/types';
import { Button, cn } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function SettingsPage() {
  const router = useRouter();
  const {
    configs,
    isLoading,
    isModalOpen,
    editingConfig,
    setConfigs,
    setLoading,
    openModal,
    closeModal,
    addConfig,
    updateConfig,
    removeConfig,
    setDefaultConfig,
  } = useConfigStore();

  const [formProvider, setFormProvider] = useState<LlmProvider>('openai');
  const [formModel, setFormModel] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.llmConfigs
      .list()
      .then(setConfigs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setConfigs, setLoading]);

  const handleOpenModal = useCallback(
    (config?: LlmConfig) => {
      if (config) {
        setFormProvider(config.provider);
        setFormModel(config.modelName);
        setFormApiKey('');
        setFormBaseUrl(config.baseUrl || '');
      } else {
        setFormProvider('openai');
        setFormModel('');
        setFormApiKey('');
        setFormBaseUrl('');
      }
      setShowApiKey(false);
      openModal(config);
    },
    [openModal]
  );

  const handleSave = useCallback(async () => {
    if (!formModel.trim()) return;
    setSaving(true);
    try {
      const data: CreateLlmConfigRequest = {
        provider: formProvider,
        modelName: formModel.trim(),
        apiKey: formApiKey.trim() || undefined,
        baseUrl: formBaseUrl.trim() || undefined,
      };

      if (editingConfig) {
        const updated = await api.llmConfigs.update(editingConfig.id, data);
        updateConfig(updated);
      } else {
        const created = await api.llmConfigs.create(data);
        addConfig(created);
      }
      closeModal();
    } catch (err) {
      console.error('保存配置失败:', err);
    } finally {
      setSaving(false);
    }
  }, [formProvider, formModel, formApiKey, formBaseUrl, editingConfig, updateConfig, addConfig, closeModal]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await api.llmConfigs.delete(id);
        removeConfig(id);
      } catch (err) {
        console.error('删除配置失败:', err);
      }
    },
    [removeConfig]
  );

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await api.llmConfigs.setDefault(id);
        setDefaultConfig(id);
      } catch (err) {
        console.error('设置默认配置失败:', err);
      }
    },
    [setDefaultConfig]
  );

  const maskApiKey = (key?: string) => {
    if (!key) return '未设置';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 16))}${key.slice(-4)}`;
  };

  const providerLabel = (provider: LlmProvider) =>
    PROVIDER_OPTIONS.find((p) => p.value === provider)?.label || provider;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-bg-secondary">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft size={16} />
              返回
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-text">设置</h1>
              <p className="text-sm text-text-muted">管理 AI 模型配置</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {/* AI Model Config Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text">AI 模型配置</h2>
            <p className="text-sm text-text-muted">配置智能体使用的 AI 模型和 API 密钥</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={14} />
            添加配置
          </Button>
        </div>

        {/* Config Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Bot size={32} className="animate-pulse text-accent/30" />
          </div>
        ) : configs.length === 0 ? (
          <Card className="py-12 text-center">
            <Server size={32} className="mx-auto mb-3 text-text-muted/30" />
            <p className="text-sm text-text-muted">暂无配置，请添加 AI 模型配置</p>
            <Button className="mt-4" onClick={() => handleOpenModal()}>
              <Plus size={14} />
              添加配置
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {configs.map((config, index) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-text">
                          {config.modelName}
                        </h3>
                        {config.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            <Star size={10} />
                            默认
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Server size={12} />
                          {providerLabel(config.provider)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Key size={12} />
                          {maskApiKey(config.apiKey)}
                        </span>
                        {config.baseUrl && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Bot size={12} />
                            {config.baseUrl}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!config.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(config.id)}
                          title="设为默认"
                        >
                          <Star size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(config)}
                        title="编辑"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        title="删除"
                        className="text-error hover:text-error"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingConfig ? '编辑配置' : '添加配置'}
      >
        <div className="space-y-4">
          <Select
            id="provider"
            label="提供商"
            options={PROVIDER_OPTIONS}
            value={formProvider}
            onChange={(e) => setFormProvider(e.target.value as LlmProvider)}
          />
          <Input
            id="modelName"
            label="模型名称"
            placeholder="例如: gpt-4o, claude-3-5-sonnet-20241022"
            value={formModel}
            onChange={(e) => setFormModel(e.target.value)}
          />
          <div className="space-y-1.5">
            <label htmlFor="apiKey" className="block text-sm font-medium text-text-secondary">
              API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-tertiary px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <Input
            id="baseUrl"
            label="Base URL（可选）"
            placeholder="https://api.openai.com/v1"
            value={formBaseUrl}
            onChange={(e) => setFormBaseUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formModel.trim() || saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
