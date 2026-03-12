import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    list(userId: string, page?: string, limit?: string): Promise<{
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
    unreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAllRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
