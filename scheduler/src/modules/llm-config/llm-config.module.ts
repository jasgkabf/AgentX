import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmConfig } from './llm-config.entity';
import { LlmConfigService } from './llm-config.service';
import { LlmConfigController } from './llm-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LlmConfig])],
  controllers: [LlmConfigController],
  providers: [LlmConfigService],
  exports: [LlmConfigService],
})
export class LlmConfigModule {}
