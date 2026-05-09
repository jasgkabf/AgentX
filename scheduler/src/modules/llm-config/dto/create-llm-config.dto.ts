import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLlmConfigDto {
  @ApiProperty({ description: '用户ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'LLM 提供商 (openai/anthropic/etc)' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: '模型名称' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({ description: 'API Key' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiPropertyOptional({ description: '自定义 Base URL' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ description: '是否设为默认配置' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '额外配置参数' })
  @IsOptional()
  @IsObject()
  config?: any;
}

export class UpdateLlmConfigDto {
  @ApiPropertyOptional({ description: 'LLM 提供商' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: '模型名称' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional({ description: 'API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: '自定义 Base URL' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ description: '是否设为默认配置' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '额外配置参数' })
  @IsOptional()
  @IsObject()
  config?: any;
}
