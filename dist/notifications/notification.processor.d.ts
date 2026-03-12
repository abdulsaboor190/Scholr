import { WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export type NotificationJobData = {
    name: 'request.received';
    requestId: string;
} | {
    name: 'request.accepted';
    requestId: string;
} | {
    name: 'request.rejected';
    requestId: string;
} | {
    name: 'request.returned';
    requestId: string;
} | {
    name: 'message.new';
    chatId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    content: string;
};
export declare class NotificationProcessor extends WorkerHost {
    private readonly notificationsService;
    private readonly prisma;
    private readonly notificationQueue;
    private readonly logger;
    constructor(notificationsService: NotificationsService, prisma: PrismaService, notificationQueue: Queue);
    process(job: Job<NotificationJobData>): Promise<void>;
    private handleRequestReceived;
    private handleRequestAccepted;
    private handleRequestRejected;
    private handleRequestReturned;
    private handleNewMessage;
    handleDueSoonAndOverdue(): Promise<void>;
}
