import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SchedulerService } from './scheduler.service';

@Processor('task-processing')
export class TaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(private readonly schedulerService: SchedulerService) {
    super();
  }

  async process(job: Job<{ taskId: string }>): Promise<void> {
    this.logger.log(`处理任务队列消息: ${job.data.taskId}, Job ID: ${job.id}`);
    try {
      await this.schedulerService.runTask(job.data.taskId);
    } catch (error) {
      this.logger.error(
        `任务处理失败 [${job.data.taskId}]: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
