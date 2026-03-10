import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a push notification to a user AND save a Notification record.
   * Always saves to DB regardless of delivery outcome.
   */
  async sendPush(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ) {
    // Always write to DB first — in-app history is source of truth
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data as any },
    });

    // Attempt push delivery
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) {
      this.logger.debug(`No push token for user ${userId}, skipping push.`);
      return notification;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      this.logger.warn(
        `Invalid Expo push token for user ${userId}: ${user.pushToken}`,
      );
      return notification;
    }

    const message: ExpoPushMessage = {
      to: user.pushToken,
      title,
      body,
      data: { ...data, type, notificationId: notification.id },
      sound: 'default',
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        receipts.forEach((receipt) => {
          if (receipt.status === 'error') {
            this.logger.warn(
              `Push error for user ${userId}: ${receipt.message}`,
            );
          }
        });
      }
      this.logger.log(`Push sent to user ${userId}: "${title}"`);
    } catch (err) {
      this.logger.error(
        `Failed to send push to user ${userId}: ${err.message}`,
      );
    }

    return notification;
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
