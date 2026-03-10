import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) { }

  async listUserChats(userId: string, page = 1, limit = 20) {
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

    const items = await Promise.all(
      chats.map(async (chat) => {
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
      }),
    );

    return {
      items,
      page,
      limit,
    };
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 30) {
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
      throw new NotFoundException('Chat not found');
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new ForbiddenException('Not a participant in this chat');
    }

    const skip = (page - 1) * limit;

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
        otherUser:
          chat.user1Id === userId
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
      messages,
      page,
      limit,
    };
  }

  async getChatDetails(chatId: string, userId: string) {
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
      throw new NotFoundException('Chat not found');
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new ForbiddenException('Not a participant in this chat');
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
      otherUser:
        chat.user1Id === userId
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
}
