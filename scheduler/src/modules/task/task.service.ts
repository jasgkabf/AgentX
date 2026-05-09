import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Task } from './task.entity';
import { TaskStep } from './task-step.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskStep)
    private readonly taskStepRepository: Repository<TaskStep>,
    @InjectQueue('task-processing')
    private readonly taskQueue: Queue,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      id: uuidv4(),
      userId: createTaskDto.userId,
      sessionId: createTaskDto.sessionId,
      description: createTaskDto.description,
      llmConfigId: createTaskDto.llmConfigId || null,
      status: 'pending',
      tokenInputCount: 0,
      tokenOutputCount: 0,
      iterationCount: 0,
    } as Task);
    const savedTask = await this.taskRepository.save(task);

    await this.taskQueue.add(
      'process-task',
      { taskId: savedTask.id },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return savedTask;
  }

  async findAll(userId?: string, sessionId?: string): Promise<Task[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (sessionId) where.sessionId = sessionId;
    return this.taskRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['steps'],
    });
    if (!task) {
      throw new NotFoundException(`任务 ${id} 不存在`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async cancel(id: string): Promise<Task> {
    const task = await this.findOne(id);
    if (task.status === 'completed') {
      throw new Error('已完成的任务无法取消');
    }
    task.status = 'cancelled';
    task.completedAt = new Date();
    return this.taskRepository.save(task);
  }

  async retry(id: string): Promise<Task> {
    const task = await this.findOne(id);
    if (task.status !== 'failed' && task.status !== 'cancelled') {
      throw new Error('只有失败或已取消的任务才能重试');
    }
    task.status = 'pending';
    task.error = null;
    task.result = null;
    task.completedAt = null;
    task.startedAt = null;
    task.tokenInputCount = 0;
    task.tokenOutputCount = 0;
    task.iterationCount = 0;
    const savedTask = await this.taskRepository.save(task);

    await this.taskStepRepository.delete({ taskId: id });

    await this.taskQueue.add(
      'process-task',
      { taskId: savedTask.id },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return savedTask;
  }

  async updateStatus(id: string, status: string, extra?: Partial<Task>): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    if (extra) {
      Object.assign(task, extra);
    }
    return this.taskRepository.save(task);
  }

  async addStep(step: Partial<TaskStep>): Promise<TaskStep> {
    const taskStep = this.taskStepRepository.create({
      id: uuidv4(),
      ...step,
    } as TaskStep);
    return this.taskStepRepository.save(taskStep);
  }

  async updateStep(stepId: string, updates: Partial<TaskStep>): Promise<TaskStep> {
    const step = await this.taskStepRepository.findOne({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException(`步骤 ${stepId} 不存在`);
    }
    Object.assign(step, updates);
    return this.taskStepRepository.save(step);
  }

  async incrementTokenCounts(
    id: string,
    inputCount: number,
    outputCount: number,
  ): Promise<void> {
    await this.taskRepository.increment(
      { id },
      'tokenInputCount',
      inputCount,
    );
    await this.taskRepository.increment(
      { id },
      'tokenOutputCount',
      outputCount,
    );
  }

  async incrementIteration(id: string): Promise<void> {
    await this.taskRepository.increment({ id }, 'iterationCount', 1);
  }
}
