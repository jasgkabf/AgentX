import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SessionService } from './session.service';

@ApiTags('会话管理')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: '创建会话' })
  async create(
    @Body() body: { userId: string; title?: string; metadata?: any },
  ) {
    return this.sessionService.create(body.userId, body.title, body.metadata);
  }

  @Get()
  @ApiOperation({ summary: '获取会话列表' })
  @ApiQuery({ name: 'userId', required: true })
  async findAll(@Query('userId') userId: string) {
    return this.sessionService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取会话详情' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新会话' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; metadata?: any },
  ) {
    return this.sessionService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '停用会话' })
  @ApiParam({ name: 'id' })
  async deactivate(@Param('id') id: string) {
    return this.sessionService.deactivate(id);
  }
}
