import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface SandboxAction {
  action_type: string;
  params: any;
}

export interface SandboxResponse {
  success: boolean;
  output: string;
  error?: string;
  data?: any;
}

const ACTION_ROUTE_MAP: Record<string, string> = {
  shell_execute: '/api/execute/shell',
  file_read: '/api/execute/file/read',
  file_write: '/api/execute/file/write',
  file_list: '/api/execute/file/list',
  browser_navigate: '/api/execute/browser/navigate',
  browser_click: '/api/execute/browser/click',
  browser_type: '/api/execute/browser/type',
  browser_screenshot: '/api/execute/browser/screenshot',
  browser_extract: '/api/execute/browser/extract',
  code_execute: '/api/execute/code',
  search_web: '/api/execute/search',
};

@Injectable()
export class SandboxClientService {
  private readonly logger = new Logger(SandboxClientService.name);

  async executeAction(
    sandboxUrl: string,
    action: SandboxAction,
  ): Promise<SandboxResponse> {
    const route = ACTION_ROUTE_MAP[action.action_type];
    if (!route) {
      this.logger.error(`未知的动作类型: ${action.action_type}`);
      return {
        success: false,
        output: '',
        error: `未知的动作类型: ${action.action_type}`,
      };
    }

    const url = `${sandboxUrl}${route}`;
    this.logger.log(`执行沙箱动作: ${action.action_type} -> ${url}`);

    try {
      const httpClient = axios.create({
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await httpClient.post(url, action.params);
      return {
        success: true,
        output: response.data.output || response.data.result || JSON.stringify(response.data),
        data: response.data,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      this.logger.error(
        `沙箱动作执行失败 [${action.action_type}]: ${errorMsg}`,
        error.stack,
      );
      return {
        success: false,
        output: '',
        error: `沙箱执行失败: ${errorMsg}`,
      };
    }
  }

  async healthCheck(sandboxUrl: string): Promise<boolean> {
    try {
      const httpClient = axios.create({ timeout: 5000 });
      const response = await httpClient.get(`${sandboxUrl}/api/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
