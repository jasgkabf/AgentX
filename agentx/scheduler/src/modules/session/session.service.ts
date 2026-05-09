import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Session } from './session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(userId: string, title?: string, metadata?: any): Promise<Session> {
    const session = this.sessionRepository.create({
      id: uuidv4(),
      userId,
      title: title || `会话 ${new Date().toLocaleString('zh-CN')}`,
      status: 'active',
      metadata: metadata || null,
    });
    return this.sessionRepository.save(session);
  }

  async findAll(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`会话 ${id} 不存在`);
    }
    return session;
  }

  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.findOne(id);
    Object.assign(session, updates);
    return this.sessionRepository.save(session);
  }

  async deactivate(id: string): Promise<Session> {
    const session = await this.findOne(id);
    session.status = 'inactive';
    return this.sessionRepository.save(session);
  }
}
