import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Queue } from 'bullmq';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
interface AuthedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        name: string;
    };
    joinedChats?: Set<string>;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly prisma;
    private readonly notificationQueue;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService, notificationQueue: Queue);
    handleConnection(client: AuthedSocket): Promise<void>;
    handleDisconnect(client: AuthedSocket): void;
    private ensureAuthed;
    private ensureChatParticipant;
    handleJoinChat(client: AuthedSocket, data: {
        chatId: string;
    }): Promise<void>;
    handleSendMessage(client: AuthedSocket, data: {
        chatId: string;
        content: string;
    }): Promise<void>;
    handleMarkRead(client: AuthedSocket, data: {
        chatId: string;
    }): Promise<void>;
    handleTyping(client: AuthedSocket, data: {
        chatId: string;
    }): Promise<void>;
    handleStopTyping(client: AuthedSocket, data: {
        chatId: string;
    }): Promise<void>;
}
export {};
