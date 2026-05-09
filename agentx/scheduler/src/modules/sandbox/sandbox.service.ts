import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance } from 'axios';
import { SandboxInstance } from './sandbox.entity';

export interface SandboxInfo {
  containerId: string;
  containerName: string;
  url: string;
}

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private readonly dockerHost: string;
  private readonly dockerHttpClient: AxiosInstance;
  private readonly sandboxImage: string;
  private readonly sandboxPort: number;

  constructor(
    @InjectRepository(SandboxInstance)
    private readonly sandboxRepository: Repository<SandboxInstance>,
    private readonly configService: ConfigService,
  ) {
    this.dockerHost = this.configService.get<string>(
      'DOCKER_HOST',
      'unix:///var/run/docker.sock',
    );
    this.sandboxImage = this.configService.get<string>(
      'SANDBOX_IMAGE',
      'agentx-sandbox',
    );
    this.sandboxPort = this.configService.get<number>('SANDBOX_PORT', 3000);

    const isUnixSocket = this.dockerHost.startsWith('unix://');
    const socketPath = isUnixSocket
      ? this.dockerHost.replace('unix://', '')
      : undefined;
    const baseURL = isUnixSocket
      ? 'http://localhost'
      : this.dockerHost;

    this.dockerHttpClient = axios.create({
      baseURL: `${baseURL}/v1.43`,
      timeout: 30000,
      socketPath,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createSandbox(taskId: string): Promise<SandboxInfo> {
    this.logger.log(`为任务 ${taskId} 创建沙箱容器`);

    const containerName = `agentx-sandbox-${taskId.slice(0, 8)}`;
    const workspacePath = `/workspace/agentx/tasks/${taskId}`;

    try {
      const createResponse = await this.dockerHttpClient.post('/containers/create', {
        name: containerName,
        Image: this.sandboxImage,
        ExposedPorts: {
          [`${this.sandboxPort}/tcp`]: {},
        },
        HostConfig: {
          PortBindings: {
            [`${this.sandboxPort}/tcp`]: [
              { HostPort: '0' },
            ],
          },
          NanoCpus: 500000000,
          Memory: 2147483648,
          MemorySwap: 2147483648,
          Binds: [
            `${workspacePath}:/workspace`,
          ],
          AutoRemove: false,
        },
        Env: [
          `TASK_ID=${taskId}`,
          `PORT=${this.sandboxPort}`,
        ],
      });

      const containerId = createResponse.data.Id;

      await this.dockerHttpClient.post(
        `/containers/${containerId}/start`,
      );

      const inspectResponse = await this.dockerHttpClient.get(
        `/containers/${containerId}/json`,
      );
      const networkSettings = inspectResponse.data.NetworkSettings;
      const ports = networkSettings.Ports;

      let sandboxUrl: string;
      if (ports[`${this.sandboxPort}/tcp`]) {
        const hostPort = ports[`${this.sandboxPort}/tcp`][0].HostPort;
        const hostIp = ports[`${this.sandboxPort}/tcp`][0].HostIp || 'localhost';
        sandboxUrl = `http://${hostIp}:${hostPort}`;
      } else {
        const containerIp = networkSettings.IPAddress;
        sandboxUrl = `http://${containerIp}:${this.sandboxPort}`;
      }

      const sandboxInstance = this.sandboxRepository.create({
        id: uuidv4(),
        taskId,
        containerId,
        containerName,
        url: sandboxUrl,
        status: 'running',
        image: this.sandboxImage,
        resourceLimits: {
          cpuPercent: 50,
          memoryMB: 2048,
        },
        workspacePath,
      });
      await this.sandboxRepository.save(sandboxInstance);

      this.logger.log(
        `沙箱容器已创建: ${containerId}, URL: ${sandboxUrl}`,
      );

      return {
        containerId,
        containerName,
        url: sandboxUrl,
      };
    } catch (error) {
      this.logger.error(
        `创建沙箱容器失败: ${error.message}`,
        error.stack,
      );
      throw new Error(`创建沙箱失败: ${error.message}`);
    }
  }

  async destroySandbox(containerId: string): Promise<void> {
    this.logger.log(`销毁沙箱容器: ${containerId}`);

    try {
      await this.dockerHttpClient.post(
        `/containers/${containerId}/stop?t=10`,
      ).catch(() => {});

      await this.dockerHttpClient.delete(
        `/containers/${containerId}?force=true&v=true`,
      );

      await this.sandboxRepository.update(
        { containerId },
        { status: 'destroyed', destroyedAt: new Date() },
      );

      this.logger.log(`沙箱容器已销毁: ${containerId}`);
    } catch (error) {
      this.logger.error(
        `销毁沙箱容器失败: ${error.message}`,
        error.stack,
      );
      throw new Error(`销毁沙箱失败: ${error.message}`);
    }
  }

  async getSandboxUrl(containerId: string): Promise<string> {
    const instance = await this.sandboxRepository.findOne({
      where: { containerId, status: 'running' },
    });
    if (!instance) {
      throw new Error(`沙箱实例不存在或已销毁: ${containerId}`);
    }
    return instance.url;
  }

  async getActiveSandboxForTask(taskId: string): Promise<SandboxInstance | null> {
    return this.sandboxRepository.findOne({
      where: { taskId, status: 'running' },
    });
  }

  async cleanupStaleSandboxes(): Promise<number> {
    const staleInstances = await this.sandboxRepository.find({
      where: { status: 'running' },
    });

    let cleanedCount = 0;
    for (const instance of staleInstances) {
      try {
        await this.dockerHttpClient.get(`/containers/${instance.containerId}/json`);
      } catch {
        instance.status = 'destroyed';
        instance.destroyedAt = new Date();
        await this.sandboxRepository.save(instance);
        cleanedCount++;
      }
    }

    this.logger.log(`清理了 ${cleanedCount} 个过期沙箱实例`);
    return cleanedCount;
  }
}
