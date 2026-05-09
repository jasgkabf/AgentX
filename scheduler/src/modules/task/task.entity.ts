import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TaskStep } from './task-step.entity';

@Entity('tasks')
export class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  sessionId: string;

  @Column('text')
  description: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  llmConfigId: string | null;

  @Column('text', { nullable: true })
  result: string | null;

  @Column('text', { nullable: true })
  error: string | null;

  @Column({ default: 0 })
  tokenInputCount: number;

  @Column({ default: 0 })
  tokenOutputCount: number;

  @Column({ default: 0 })
  iterationCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  startedAt: Date | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @OneToMany(() => TaskStep, (step) => step.task)
  steps: TaskStep[];
}
