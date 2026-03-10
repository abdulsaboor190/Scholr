import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

interface AuthedSocket extends Socket {
  user?: { id: string; email: string; name: string };
  joinedChats?: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers['authorization']
          ?.toString()
          .replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedException('Missing token');
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      client.user = { id: user.id, email: user.email, name: user.name };
      client.join(`user:${user.id}`);
      client.joinedChats = new Set();

      this.logger.log(`Client connected: ${user.id}`);
    } catch (err) {
      this.logger.warn(`Socket connection rejected: ${err.message}`);
      client.emit('error', {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Client disconnected: ${client.user?.id ?? 'unknown'}`);
  }

  private ensureAuthed(client: AuthedSocket) {
    if (!client.user) {
      throw new UnauthorizedException('Not authenticated');
    }
  }

  private async ensureChatParticipant(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, user1Id: true, user2Id: true },
    });
    if (!chat) {
      throw new ForbiddenException('Chat not found');
    }
    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new ForbiddenException('Not a participant in this chat');
    }
    return chat;
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      this.ensureAuthed(client);
      const { id: userId } = client.user!;
      const { chatId } = data;

      await this.ensureChatParticipant(chatId, userId);

      const room = `chat:${chatId}`;
      client.join(room);
      client.joinedChats?.add(chatId);
    } catch (error) {
      client.emit('error', {
        code: 'JOIN_CHAT_FAILED',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { chatId: string; content: string },
  ) {
    try {
      this.ensureAuthed(client);
      const { id: userId, name: userName } = client.user!;
      const { chatId, content } = data;

      if (!content || !content.trim()) {
        throw new ForbiddenException('Message content required');
      }

      const chat = await this.ensureChatParticipant(chatId, userId);

      const message = await this.prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content: content.trim(),
        },
      });

      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessage: content.trim(),
        },
      });

      const payload = {
        messageId: message.id,
        chatId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      };

      this.server.to(`chat:${chatId}`).emit('new_message', payload);

      // Check if recipient is offline → enqueue push notification
      const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const socketsInRoom = await this.server
        .in(`user:${recipientId}`)
        .fetchSockets();
      if (!socketsInRoom.length) {
        await this.notificationQueue.add(
          'message.new',
          {
            chatId,
            senderId: userId,
            senderName: userName,
            recipientId,
            content: content.trim(),
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }
    } catch (error) {
      client.emit('error', {
        code: 'SEND_MESSAGE_FAILED',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      this.ensureAuthed(client);
      const { id: userId } = client.user!;
      const { chatId } = data;

      await this.ensureChatParticipant(chatId, userId);

      const now = new Date();
      await this.prisma.message.updateMany({
        where: {
          chatId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: now },
      });

      this.server.to(`chat:${chatId}`).emit('messages_read', {
        chatId,
        readBy: userId,
        readAt: now,
      });
    } catch (error) {
      client.emit('error', {
        code: 'MARK_READ_FAILED',
        message: error.message,
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      this.ensureAuthed(client);
      const { id: userId } = client.user!;
      const { chatId } = data;

      await this.ensureChatParticipant(chatId, userId);

      // Emit only to the OTHER participants, not the sender
      client.broadcast
        .to(`chat:${chatId}`)
        .emit('user_typing', { chatId, userId });
    } catch (error) {
      client.emit('error', { code: 'TYPING_FAILED', message: error.message });
    }
  }

  @SubscribeMessage('stop_typing')
  async handleStopTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      this.ensureAuthed(client);
      const { id: userId } = client.user!;
      const { chatId } = data;

      await this.ensureChatParticipant(chatId, userId);

      client.broadcast
        .to(`chat:${chatId}`)
        .emit('user_stopped_typing', { chatId, userId });
    } catch (error) {
      client.emit('error', {
        code: 'STOP_TYPING_FAILED',
        message: error.message,
      });
    }
  }
}
