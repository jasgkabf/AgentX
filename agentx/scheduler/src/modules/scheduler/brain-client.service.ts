import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ThinkRequest {
  taskId: string;
  taskDescription: string;
  history: StepHistory[];
  llmConfig: {
    provider: string;
    modelName: string;
    apiKey: string;
    baseUrl?: string;
    config?: any;
  };
}

export interface StepHistory {
  stepNumber: number;
  thinking: string;
  actionType: string;
  actionParams: any;
  observation: string;
}

export interface ThinkResponse {
  thinking: string;
  action: {
    action_type: string;
    params: any;
  } | null;
  is_completed: boolean;
  result?: string;
  tokenInputCount: number;
  tokenOutputCount: number;
}

export interface ToolInfo {
  name: string;
  description: string;
  parameters: any;
}

@Injectable()
export class BrainClientService {
  private readonly logger = new Logger(BrainClientService.name);
  private readonly brainUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.brainUrl = this.configService.get<string>('BRAIN_URL', 'http://brain:8000');
    this.httpClient = axios.create({
      baseURL: this.brainUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async think(request: ThinkRequest): Promise<ThinkResponse> {
    try {
      this.logger.log(`调用 Brain think API，任务ID: ${request.taskId}`);
      const response = await this.httpClient.post('/api/agent/think', request);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Brain think API 调用失败: ${error.message}`,
        error.stack,
      );
      throw new Error(`Brain 服务调用失败: ${error.message}`);
    }
  }

  async getTools(): Promise<ToolInfo[]> {
    try {
      this.logger.log('调用 Brain getTools API');
      const response = await this.httpClient.get('/api/agent/tools');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Brain getTools API 调用失败: ${error.message}`,
        error.stack,
      );
      throw new Error(`Brain 服务获取工具列表失败: ${error.message}`);
    }
  }
}
