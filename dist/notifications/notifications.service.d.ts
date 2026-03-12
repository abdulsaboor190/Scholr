import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    private readonly expo;
    constructor(prisma: PrismaService);
    sendPush(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, unknown>): Promise<{
        id: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        isRead: boolean;
    }>;
    listForUser(userId: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            type: import(".prisma/client").$Enums.NotificationType;
            title: string;
            userId: string;
            body: string;
            isRead: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    markRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
}
