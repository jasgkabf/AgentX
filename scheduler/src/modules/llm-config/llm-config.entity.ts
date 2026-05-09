import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('llm_configs')
export class LlmConfig {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  provider: string;

  @Column()
  modelName: string;

  @Column()
  apiKeyEncrypted: string;

  @Column({ nullable: true })
  baseUrl: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column('jsonb', { nullable: true })
  config: any;

  @CreateDateColumn()
  createdAt: Date;
}
