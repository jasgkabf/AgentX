import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';
import { LlmConfig } from './llm-config.entity';
import {
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
} from './dto/create-llm-config.dto';

@Injectable()
export class LlmConfigService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(LlmConfig)
    private readonly llmConfigRepository: Repository<LlmConfig>,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'default-encryption-key-change-me',
    );
  }

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  private decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    return apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
  }

  async create(createDto: CreateLlmConfigDto): Promise<LlmConfig> {
    if (createDto.isDefault) {
      await this.clearDefaultForUser(createDto.userId);
    }

    const config = this.llmConfigRepository.create({
      id: uuidv4(),
      userId: createDto.userId,
      provider: createDto.provider,
      modelName: createDto.modelName,
      apiKeyEncrypted: this.encrypt(createDto.apiKey),
      baseUrl: createDto.baseUrl || null,
      isDefault: createDto.isDefault || false,
      config: createDto.config || null,
    } as LlmConfig);
    return this.llmConfigRepository.save(config);
  }

  async findAll(userId: string): Promise<any[]> {
    const configs = await this.llmConfigRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return configs.map((config) => ({
      ...config,
      apiKeyEncrypted: undefined,
      apiKeyMasked: this.maskApiKey(this.decrypt(config.apiKeyEncrypted)),
    }));
  }

  async findOne(id: string, withDecryptedKey = false): Promise<any> {
    const config = await this.llmConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`LLM 配置 ${id} 不存在`);
    }
    if (withDecryptedKey) {
      return {
        ...config,
        apiKey: this.decrypt(config.apiKeyEncrypted),
        apiKeyEncrypted: undefined,
      };
    }
    return {
      ...config,
      apiKeyMasked: this.maskApiKey(this.decrypt(config.apiKeyEncrypted)),
      apiKeyEncrypted: undefined,
    };
  }

  async update(id: string, updateDto: UpdateLlmConfigDto): Promise<LlmConfig> {
    const config = await this.llmConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`LLM 配置 ${id} 不存在`);
    }

    if (updateDto.isDefault) {
      await this.clearDefaultForUser(config.userId);
    }

    if (updateDto.provider) config.provider = updateDto.provider;
    if (updateDto.modelName) config.modelName = updateDto.modelName;
    if (updateDto.apiKey) {
      config.apiKeyEncrypted = this.encrypt(updateDto.apiKey);
    }
    if (updateDto.baseUrl !== undefined) config.baseUrl = updateDto.baseUrl || null;
    if (updateDto.isDefault !== undefined) config.isDefault = updateDto.isDefault;
    if (updateDto.config !== undefined) config.config = updateDto.config;

    return this.llmConfigRepository.save(config);
  }

  async remove(id: string): Promise<void> {
    const config = await this.llmConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`LLM 配置 ${id} 不存在`);
    }
    await this.llmConfigRepository.remove(config);
  }

  async setDefault(id: string): Promise<LlmConfig> {
    const config = await this.llmConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`LLM 配置 ${id} 不存在`);
    }
    await this.clearDefaultForUser(config.userId);
    config.isDefault = true;
    return this.llmConfigRepository.save(config);
  }

  async getDefault(userId: string): Promise<any> {
    const config = await this.llmConfigRepository.findOne({
      where: { userId, isDefault: true },
    });
    if (!config) {
      const firstConfig = await this.llmConfigRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (!firstConfig) {
        return null;
      }
      return this.findOne(firstConfig.id, true);
    }
    return this.findOne(config.id, true);
  }

  private async clearDefaultForUser(userId: string): Promise<void> {
    await this.llmConfigRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
