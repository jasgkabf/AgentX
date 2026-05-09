import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';

@ApiTags('任务管理')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'sessionId', required: false })
  async findAll(
    @Query('userId') userId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.taskService.findAll(userId, sessionId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新任务' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消任务' })
  @ApiParam({ name: 'id' })
  async cancel(@Param('id') id: string) {
    return this.taskService.cancel(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: '重试任务' })
  @ApiParam({ name: 'id' })
  async retry(@Param('id') id: string) {
    return this.taskService.retry(id);
  }
}
