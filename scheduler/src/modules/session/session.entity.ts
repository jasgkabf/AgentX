import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from '../task/task.entity';

@Entity('sessions')
export class Session {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: 'active' })
  status: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.sessionId)
  tasks: Task[];
}
