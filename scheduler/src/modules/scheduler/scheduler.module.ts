import { Module } from '@nestjs/common';
import { TaskModule } from '../task/task.module';
import { LlmConfigModule } from '../llm-config/llm-config.module';
import { SandboxModule } from '../sandbox/sandbox.module';
import { GatewayModule } from '../gateway/gateway.module';
import { SchedulerService } from './scheduler.service';
import { BrainClientService } from './brain-client.service';
import { SandboxClientService } from './sandbox-client.service';
import { TaskProcessor } from './task.processor';

@Module({
  imports: [TaskModule, LlmConfigModule, SandboxModule, GatewayModule],
  providers: [
    SchedulerService,
    BrainClientService,
    SandboxClientService,
    TaskProcessor,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
