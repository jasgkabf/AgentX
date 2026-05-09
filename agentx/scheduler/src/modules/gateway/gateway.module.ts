import { Module } from '@nestjs/common';
import { TaskGateway } from './task.gateway';

@Module({
  providers: [TaskGateway],
  exports: [TaskGateway],
})
export class GatewayModule {}
