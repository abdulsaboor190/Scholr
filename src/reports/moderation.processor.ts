import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Redis } from 'ioredis';

@Processor('moderation')
@Injectable()
export class ModerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ModerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing moderation job: ${job.name} [${job.id}]`);

    switch (job.name) {
      case 'auto.hidden':
        await this.handleAutoHidden(job.data as any);
        break;
      case 'suspend.user':
        await this.handleSuspendUser(job.data as any);
        break;
      default:
        this.logger.warn(`Unknown moderation job: ${job.name}`);
    }
  }

  private async handleAutoHidden(data: {
    targetType: string;
    targetId: string;
    reportCount: number;
  }) {
    // Notify all admins ideally, but here we just log it as the queue processes it safely
    this.logger.warn(
      `Content auto-hidden: ${data.targetType}:${data.targetId} (Reports: ${data.reportCount})`,
    );
  }

  private async handleSuspendUser(data: { userId: string }) {
    // 1. Delete refresh token from Redis to invalidate sessions
    await this.redis.del(`refresh_token:${data.userId}`);
    this.logger.log(`Invalidated sessions for suspended user ${data.userId}`);
  }
}
