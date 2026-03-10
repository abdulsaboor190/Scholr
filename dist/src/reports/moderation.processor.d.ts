import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Redis } from 'ioredis';
export declare class ModerationProcessor extends WorkerHost {
    private readonly prisma;
    private readonly notifications;
    private redis;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, redis: Redis);
    process(job: Job): Promise<void>;
    private handleAutoHidden;
    private handleSuspendUser;
}
