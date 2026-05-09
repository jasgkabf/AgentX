import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Task } from './task.entity';
import { TaskStep } from './task-step.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskStep]),
    BullModule.registerQueue({
      name: 'task-processing',
    }),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
