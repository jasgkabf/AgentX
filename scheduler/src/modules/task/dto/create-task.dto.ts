import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '会话ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: '任务描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'LLM 配置ID' })
  @IsOptional()
  @IsUUID()
  llmConfigId?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: '任务状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '任务结果' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: '输入 Token 数' })
  @IsOptional()
  tokenInputCount?: number;

  @ApiPropertyOptional({ description: '输出 Token 数' })
  @IsOptional()
  tokenOutputCount?: number;

  @ApiPropertyOptional({ description: '迭代次数' })
  @IsOptional()
  iterationCount?: number;
}
