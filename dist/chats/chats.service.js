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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatsService = class ChatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUserChats(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const chats = await this.prisma.chat.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
            include: {
                request: {
                    include: {
                        book: true,
                        requester: true,
                    },
                },
                user1: true,
                user2: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
        });
        const items = await Promise.all(chats.map(async (chat) => {
            const other = chat.user1Id === userId ? chat.user2 : chat.user1;
            const unreadCount = await this.prisma.message.count({
                where: {
                    chatId: chat.id,
                    senderId: { not: userId },
                    readAt: null,
                },
            });
            const lastMessage = chat.messages[0] || null;
            return {
                id: chat.id,
                otherUser: {
                    id: other.id,
                    name: other.name,
                    avatarUrl: other.avatarUrl,
                },
                book: {
                    id: chat.request.book.id,
                    title: chat.request.book.title,
                },
                lastMessage: lastMessage
                    ? {
                        content: lastMessage.content,
                        senderId: lastMessage.senderId,
                        createdAt: lastMessage.createdAt,
                    }
                    : null,
                unreadCount,
                updatedAt: chat.updatedAt,
            };
        }));
        return {
            items,
            page,
            limit,
        };
    }
    async getMessages(chatId, userId, page = 1, limit = 30) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user1: true,
                user2: true,
                request: {
                    include: { book: true },
                },
            },
        });
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        if (chat.user1Id !== userId && chat.user2Id !== userId) {
            throw new common_1.ForbiddenException('Not a participant in this chat');
        }
        const skip = (page - 1) * limit;
        const total = await this.prisma.message.count({ where: { chatId } });
        const messages = await this.prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        return {
            chat: {
                id: chat.id,
                book: {
                    id: chat.request.book.id,
                    title: chat.request.book.title,
                },
                request: {
                    id: chat.request.id,
                    status: chat.request.status,
                    requesterId: chat.request.requesterId,
                },
                otherUser: chat.user1Id === userId
                    ? {
                        id: chat.user2.id,
                        name: chat.user2.name,
                        avatarUrl: chat.user2.avatarUrl,
                    }
                    : {
                        id: chat.user1.id,
                        name: chat.user1.name,
                        avatarUrl: chat.user1.avatarUrl,
                    },
            },
            items: messages,
            total,
            page,
            limit,
        };
    }
    async getChatDetails(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                user1: true,
                user2: true,
                request: {
                    include: { book: true },
                },
            },
        });
        if (!chat) {
            throw new common_1.NotFoundException('Chat not found');
        }
        if (chat.user1Id !== userId && chat.user2Id !== userId) {
            throw new common_1.ForbiddenException('Not a participant in this chat');
        }
        return {
            id: chat.id,
            book: {
                id: chat.request.book.id,
                title: chat.request.book.title,
                status: chat.request.book.status,
                imageUrl: chat.request.book.imageUrl,
            },
            request: {
                id: chat.request.id,
                status: chat.request.status,
                requesterId: chat.request.requesterId,
            },
            otherUser: chat.user1Id === userId
                ? {
                    id: chat.user2.id,
                    name: chat.user2.name,
                    avatarUrl: chat.user2.avatarUrl,
                }
                : {
                    id: chat.user1.id,
                    name: chat.user1.name,
                    avatarUrl: chat.user1.avatarUrl,
                },
        };
    }
    async sendMessage(chatId, userId, content) {
        if (!content || !content.trim()) {
            throw new common_1.ForbiddenException('Message content required');
        }
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
        });
        if (!chat || (chat.user1Id !== userId && chat.user2Id !== userId)) {
            throw new common_1.ForbiddenException('Not a participant in this chat');
        }
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
        return message;
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatsService);
//# sourceMappingURL=chats.service.js.map