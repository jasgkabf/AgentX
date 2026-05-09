import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sandbox_instances')
export class SandboxInstance {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column()
  containerId: string;

  @Column()
  containerName: string;

  @Column()
  url: string;

  @Column({ default: 'creating' })
  status: string;

  @Column({ nullable: true })
  image: string;

  @Column('jsonb', { nullable: true })
  resourceLimits: any;

  @Column({ nullable: true })
  workspacePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  destroyedAt: Date;
}
