import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/tasks',
})
export class TaskGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskGateway.name);
  private readonly taskRooms: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket): void {
    this.logger.log(`WebSocket 客户端连接: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WebSocket 客户端断开: ${client.id}`);
    for (const [taskId, clients] of this.taskRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.taskRooms.delete(taskId);
        }
      }
    }
  }

  @SubscribeMessage('subscribe_task')
  handleSubscribeTask(client: Socket, taskId: string): void {
    const room = `task:${taskId}`;
    client.join(room);

    if (!this.taskRooms.has(taskId)) {
      this.taskRooms.set(taskId, new Set());
    }
    const roomClients = this.taskRooms.get(taskId);
    if (roomClients) {
      roomClients.add(client.id);
    }

    this.logger.log(`客户端 ${client.id} 订阅任务: ${taskId}`);
    client.emit('subscribed', { taskId });
  }

  @SubscribeMessage('unsubscribe_task')
  handleUnsubscribeTask(client: Socket, taskId: string): void {
    const room = `task:${taskId}`;
    client.leave(room);

    const roomClients = this.taskRooms.get(taskId);
    if (roomClients) {
      roomClients.delete(client.id);
      if (roomClients.size === 0) {
        this.taskRooms.delete(taskId);
      }
    }

    this.logger.log(`客户端 ${client.id} 取消订阅任务: ${taskId}`);
    client.emit('unsubscribed', { taskId });
  }

  emitThinking(taskId: string, content: string): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('thinking', {
      taskId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  emitAction(taskId: string, action: any): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('action', {
      taskId,
      ...action,
      timestamp: new Date().toISOString(),
    });
  }

  emitTerminal(taskId: string, data: any): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('terminal', {
      taskId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitBrowser(taskId: string, screenshot: string): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('browser', {
      taskId,
      screenshot,
      timestamp: new Date().toISOString(),
    });
  }

  emitStatus(taskId: string, status: string): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('status', {
      taskId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitCompleted(taskId: string, result: string): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('completed', {
      taskId,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  emitFailed(taskId: string, error: string): void {
    const room = `task:${taskId}`;
    this.server.to(room).emit('failed', {
      taskId,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
