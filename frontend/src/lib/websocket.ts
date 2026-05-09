import { io, Socket } from 'socket.io-client';
import { WebSocketEvents } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

type TaskCallbacks = WebSocketEvents;

export class WebSocketClient {
  private socket: Socket | null = null;
  private subscriptions: Map<string, TaskCallbacks> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] 已连接');
      this.subscriptions.forEach((_, taskId) => {
        this.socket?.emit('subscribe:task', taskId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] 已断开:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] 连接错误:', error);
    });

    this.socket.on('task:thinking', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onThinking(data);
    });

    this.socket.on('task:action', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onAction(data);
    });

    this.socket.on('task:terminal', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onTerminal(data);
    });

    this.socket.on('task:browser', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onBrowser(data);
    });

    this.socket.on('task:status', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onStatus(data);
    });

    this.socket.on('task:completed', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onCompleted(data);
    });

    this.socket.on('task:failed', (data) => {
      const callbacks = this.subscriptions.get(data.taskId);
      callbacks?.onFailed(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.subscriptions.forEach((_, taskId) => {
        this.socket?.emit('unsubscribe:task', taskId);
      });
      this.socket.disconnect();
      this.socket = null;
      this.subscriptions.clear();
    }
  }

  subscribeTask(taskId: string, callbacks: TaskCallbacks): void {
    this.subscriptions.set(taskId, callbacks);
    if (this.socket?.connected) {
      this.socket.emit('subscribe:task', taskId);
    }
  }

  unsubscribeTask(taskId: string): void {
    this.subscriptions.delete(taskId);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe:task', taskId);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsClient = new WebSocketClient();
