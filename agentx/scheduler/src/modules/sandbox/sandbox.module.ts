import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SandboxInstance } from './sandbox.entity';
import { SandboxService } from './sandbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([SandboxInstance])],
  providers: [SandboxService],
  exports: [SandboxService],
})
export class SandboxModule {}
