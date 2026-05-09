import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { TaskModule } from './modules/task/task.module';
import { LlmConfigModule } from './modules/llm-config/llm-config.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { SessionModule } from './modules/session/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    TaskModule,
    LlmConfigModule,
    SchedulerModule,
    SandboxModule,
    GatewayModule,
    SessionModule,
  ],
})
export class AppModule {}
