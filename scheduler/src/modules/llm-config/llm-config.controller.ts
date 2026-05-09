import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LlmConfigService } from './llm-config.service';
import {
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
} from './dto/create-llm-config.dto';

@ApiTags('LLM 配置管理')
@Controller('llm-configs')
export class LlmConfigController {
  constructor(private readonly llmConfigService: LlmConfigService) {}

  @Post()
  @ApiOperation({ summary: '创建 LLM 配置' })
  async create(@Body() createDto: CreateLlmConfigDto) {
    return this.llmConfigService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取 LLM 配置列表' })
  @ApiQuery({ name: 'userId', required: true })
  async findAll(@Query('userId') userId: string) {
    return this.llmConfigService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取 LLM 配置详情' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.llmConfigService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新 LLM 配置' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateLlmConfigDto) {
    return this.llmConfigService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 LLM 配置' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    await this.llmConfigService.remove(id);
    return { message: '配置已删除' };
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: '设为默认配置' })
  @ApiParam({ name: 'id' })
  async setDefault(@Param('id') id: string) {
    return this.llmConfigService.setDefault(id);
  }
}
