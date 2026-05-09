import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_steps')
export class TaskStep {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column()
  stepNumber: number;

  @Column('text', { nullable: true })
  thinking: string | null;

  @Column({ nullable: true })
  actionType: string | null;

  @Column('jsonb', { nullable: true })
  actionParams: any;

  @Column('text', { nullable: true })
  observation: string | null;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  durationMs: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, (task) => task.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
