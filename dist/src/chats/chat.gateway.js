"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    prisma;
    notificationQueue;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(jwtService, prisma, notificationQueue) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.notificationQueue = notificationQueue;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers['authorization']
                    ?.toString()
                    .replace('Bearer ', '');
            if (!token) {
                throw new common_1.UnauthorizedException('Missing token');
            }
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            client.user = { id: user.id, email: user.email, name: user.name };
            client.join(`user:${user.id}`);
            client.joinedChats = new Set();
            this.logger.log(`Client connected: ${user.id}`);
        }
        catch (err) {
            this.logger.warn(`Socket connection rejected: ${err.message}`);
            client.emit('error', {
                code: 'AUTH_FAILED',
                message: 'Authentication failed',
            });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.user?.id ?? 'unknown'}`);
    }
    ensureAuthed(client) {
        if (!client.user) {
            throw new common_1.UnauthorizedException('Not authenticated');
        }
    }
    async ensureChatParticipant(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { id: true, user1Id: true, user2Id: true },
        });
        if (!chat) {
            throw new common_1.ForbiddenException('Chat not found');
        }
        if (chat.user1Id !== userId && chat.user2Id !== userId) {
            throw new common_1.ForbiddenException('Not a participant in this chat');
        }
        return chat;
    }
    async handleJoinChat(client, data) {
        try {
            this.ensureAuthed(client);
            const { id: userId } = client.user;
            const { chatId } = data;
            await this.ensureChatParticipant(chatId, userId);
            const room = `chat:${chatId}`;
            client.join(room);
            client.joinedChats?.add(chatId);
        }
        catch (error) {
            client.emit('error', {
                code: 'JOIN_CHAT_FAILED',
                message: error.message,
            });
        }
    }
    async handleSendMessage(client, data) {
        try {
            this.ensureAuthed(client);
            const { id: userId, name: userName } = client.user;
            const { chatId, content } = data;
            if (!content || !content.trim()) {
                throw new common_1.ForbiddenException('Message content required');
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
            const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
            const socketsInRoom = await this.server
                .in(`user:${recipientId}`)
                .fetchSockets();
            if (!socketsInRoom.length) {
                await this.notificationQueue.add('message.new', {
                    chatId,
                    senderId: userId,
                    senderName: userName,
                    recipientId,
                    content: content.trim(),
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                });
            }
        }
        catch (error) {
            client.emit('error', {
                code: 'SEND_MESSAGE_FAILED',
                message: error.message,
            });
        }
    }
    async handleMarkRead(client, data) {
        try {
            this.ensureAuthed(client);
            const { id: userId } = client.user;
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
        }
        catch (error) {
            client.emit('error', {
                code: 'MARK_READ_FAILED',
                message: error.message,
            });
        }
    }
    async handleTyping(client, data) {
        try {
            this.ensureAuthed(client);
            const { id: userId } = client.user;
            const { chatId } = data;
            await this.ensureChatParticipant(chatId, userId);
            client.broadcast
                .to(`chat:${chatId}`)
                .emit('user_typing', { chatId, userId });
        }
        catch (error) {
            client.emit('error', { code: 'TYPING_FAILED', message: error.message });
        }
    }
    async handleStopTyping(client, data) {
        try {
            this.ensureAuthed(client);
            const { id: userId } = client.user;
            const { chatId } = data;
            await this.ensureChatParticipant(chatId, userId);
            client.broadcast
                .to(`chat:${chatId}`)
                .emit('user_stopped_typing', { chatId, userId });
        }
        catch (error) {
            client.emit('error', {
                code: 'STOP_TYPING_FAILED',
                message: error.message,
            });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop_typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleStopTyping", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __param(2, (0, bullmq_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        bullmq_2.Queue])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map