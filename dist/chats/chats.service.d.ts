import { PrismaService } from '../prisma/prisma.service';
export declare class ChatsService {
    private prisma;
    constructor(prisma: PrismaService);
    listUserChats(userId: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            otherUser: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            book: {
                id: string;
                title: string;
            };
            lastMessage: {
                content: string;
                senderId: string;
                createdAt: Date;
            } | null;
            unreadCount: number;
            updatedAt: Date;
        }[];
        page: number;
        limit: number;
    }>;
    getMessages(chatId: string, userId: string, page?: number, limit?: number): Promise<{
        chat: {
            id: string;
            book: {
                id: string;
                title: string;
            };
            request: {
                id: string;
                status: import(".prisma/client").$Enums.BorrowRequestStatus;
                requesterId: string;
            };
            otherUser: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        };
        items: {
            id: string;
            createdAt: Date;
            isHidden: boolean;
            chatId: string;
            senderId: string;
            content: string;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getChatDetails(chatId: string, userId: string): Promise<{
        id: string;
        book: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.BookStatus;
            imageUrl: string | null;
        };
        request: {
            id: string;
            status: import(".prisma/client").$Enums.BorrowRequestStatus;
            requesterId: string;
        };
        otherUser: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    sendMessage(chatId: string, userId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        isHidden: boolean;
        chatId: string;
        senderId: string;
        content: string;
        readAt: Date | null;
    }>;
}
