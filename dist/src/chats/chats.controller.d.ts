import { ChatsService } from './chats.service';
export declare class ChatsController {
    private chatsService;
    constructor(chatsService: ChatsService);
    listChats(userId: string, page?: string, limit?: string): Promise<{
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
    getChat(chatId: string, userId: string): Promise<{
        id: string;
        book: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.BookStatus;
            imageUrl: string | null;
        };
        request: {
            id: string;
            status: import("@prisma/client").$Enums.BorrowRequestStatus;
            requesterId: string;
        };
        otherUser: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    getMessages(chatId: string, userId: string, page?: string, limit?: string): Promise<{
        chat: {
            id: string;
            book: {
                id: string;
                title: string;
            };
            request: {
                id: string;
                status: import("@prisma/client").$Enums.BorrowRequestStatus;
                requesterId: string;
            };
            otherUser: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        };
        messages: {
            id: string;
            createdAt: Date;
            isHidden: boolean;
            chatId: string;
            senderId: string;
            content: string;
            readAt: Date | null;
        }[];
        page: number;
        limit: number;
    }>;
}
