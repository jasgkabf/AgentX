import { Injectable, Logger } from '@nestjs/common';
import { TaskService } from '../task/task.service';
import { LlmConfigService } from '../llm-config/llm-config.service';
import { BrainClientService, ThinkResponse } from './brain-client.service';
import { SandboxClientService } from './sandbox-client.service';
import { SandboxService } from '../sandbox/sandbox.service';
import { TaskGateway } from '../gateway/task.gateway';
import { Task } from '../task/task.entity';

const MAX_ITERATIONS = 30;

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly llmConfigService: LlmConfigService,
    private readonly brainClient: BrainClientService,
    private readonly sandboxClient: SandboxClientService,
    private readonly sandboxService: SandboxService,
    private readonly taskGateway: TaskGateway,
  ) {}

  async runTask(taskId: string): Promise<void> {
    this.logger.log(`开始调度任务: ${taskId}`);

    let task: Task;
    let sandboxId: string | null = null;
    let sandboxUrl: string | null = null;

    try {
      task = await this.taskService.findOne(taskId);

      await this.taskService.updateStatus(taskId, 'running', {
        startedAt: new Date(),
      });
      this.taskGateway.emitStatus(taskId, 'running');

      let llmConfig: any;
      if (task.llmConfigId) {
        llmConfig = await this.llmConfigService.findOne(task.llmConfigId, true);
      } else {
        llmConfig = await this.llmConfigService.getDefault(task.userId);
      }

      if (!llmConfig) {
        throw new Error('未找到 LLM 配置，请先配置 LLM');
      }

      this.taskGateway.emitStatus(taskId, 'creating_sandbox');
      const sandboxInfo = await this.sandboxService.createSandbox(taskId);
      sandboxId = sandboxInfo.containerId;
      sandboxUrl = sandboxInfo.url;
      this.taskGateway.emitStatus(taskId, 'sandbox_ready');

      const history: any[] = [];
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        iteration++;
        this.logger.log(
          `任务 ${taskId} 第 ${iteration} 次迭代`,
        );

        await this.taskService.incrementIteration(taskId);

        const thinkRequest = {
          taskId,
          taskDescription: task.description,
          history,
          llmConfig: {
            provider: llmConfig.provider,
            modelName: llmConfig.modelName,
            apiKey: llmConfig.apiKey,
            baseUrl: llmConfig.baseUrl,
            config: llmConfig.config,
          },
        };

        this.taskGateway.emitStatus(taskId, 'thinking');
        const thinkResponse: ThinkResponse = await this.brainClient.think(thinkRequest);

        await this.taskService.incrementTokenCounts(
          taskId,
          thinkResponse.tokenInputCount || 0,
          thinkResponse.tokenOutputCount || 0,
        );

        const step = await this.taskService.addStep({
          taskId,
          stepNumber: iteration,
          thinking: thinkResponse.thinking,
          actionType: thinkResponse.action?.action_type || null,
          actionParams: thinkResponse.action?.params || null,
          status: 'running',
        } as any);

        this.taskGateway.emitThinking(taskId, thinkResponse.thinking);

        if (thinkResponse.is_completed || !thinkResponse.action) {
          this.logger.log(`任务 ${taskId} 已完成，迭代次数: ${iteration}`);

          await this.taskService.updateStep(step.id, {
            status: 'completed',
            observation: thinkResponse.result || '任务完成',
          });

          await this.taskService.updateStatus(taskId, 'completed', {
            result: thinkResponse.result || thinkResponse.thinking,
            completedAt: new Date(),
          });

          this.taskGateway.emitCompleted(taskId, thinkResponse.result || thinkResponse.thinking);
          break;
        }

        this.taskGateway.emitAction(taskId, {
          stepNumber: iteration,
          actionType: thinkResponse.action.action_type,
          params: thinkResponse.action.params,
        });

        const actionStartTime = Date.now();
        const sandboxResponse = await this.sandboxClient.executeAction(
          sandboxUrl!,
          thinkResponse.action,
        );
        const actionDuration = Date.now() - actionStartTime;

        const observation = sandboxResponse.success
          ? sandboxResponse.output
          : `执行失败: ${sandboxResponse.error}`;

        await this.taskService.updateStep(step.id, {
          status: sandboxResponse.success ? 'completed' : 'failed',
          observation,
          durationMs: actionDuration,
        });

        if (thinkResponse.action.action_type.startsWith('browser_')) {
          if (sandboxResponse.data?.screenshot) {
            this.taskGateway.emitBrowser(taskId, sandboxResponse.data.screenshot);
          }
        }

        if (
          thinkResponse.action.action_type === 'shell_execute' ||
          thinkResponse.action.action_type === 'code_execute'
        ) {
          this.taskGateway.emitTerminal(taskId, {
            stepNumber: iteration,
            output: observation,
            success: sandboxResponse.success,
          });
        }

        history.push({
          stepNumber: iteration,
          thinking: thinkResponse.thinking,
          actionType: thinkResponse.action.action_type,
          actionParams: thinkResponse.action.params,
          observation,
        });

        if (iteration >= MAX_ITERATIONS) {
          this.logger.warn(`任务 ${taskId} 达到最大迭代次数 ${MAX_ITERATIONS}`);
          await this.taskService.updateStatus(taskId, 'completed', {
            result: `任务达到最大迭代次数 (${MAX_ITERATIONS})，最后观察: ${observation}`,
            completedAt: new Date(),
          });
          this.taskGateway.emitCompleted(
            taskId,
            `任务达到最大迭代次数 (${MAX_ITERATIONS})`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `任务 ${taskId} 执行失败: ${error.message}`,
        error.stack,
      );

      try {
        await this.taskService.updateStatus(taskId, 'failed', {
          error: error.message,
          completedAt: new Date(),
        });
      } catch (updateError) {
        this.logger.error(`更新任务状态失败: ${updateError.message}`);
      }

      this.taskGateway.emitFailed(taskId, error.message);
    } finally {
      if (sandboxId) {
        try {
          await this.sandboxService.destroySandbox(sandboxId);
          this.logger.log(`沙箱 ${sandboxId} 已清理`);
        } catch (cleanupError) {
          this.logger.error(
            `沙箱清理失败: ${cleanupError.message}`,
          );
        }
      }
    }
  }
}
