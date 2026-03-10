import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { BorrowRequestStatus, BookStatus } from '@prisma/client';

export type NotificationJobData =
  | { name: 'request.received'; requestId: string }
  | { name: 'request.accepted'; requestId: string }
  | { name: 'request.rejected'; requestId: string }
  | { name: 'request.returned'; requestId: string }
  | {
    name: 'message.new';
    chatId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    content: string;
  };

@Processor('notifications')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing job: ${job.name} [${job.id}]`);

    switch (job.name) {
      case 'request.received':
        await this.handleRequestReceived(job.data as any);
        break;
      case 'request.accepted':
        await this.handleRequestAccepted(job.data as any);
        break;
      case 'request.rejected':
        await this.handleRequestRejected(job.data as any);
        break;
      case 'request.returned':
        await this.handleRequestReturned(job.data as any);
        break;
      case 'message.new':
        await this.handleNewMessage(job.data as any);
        break;
      default:
        this.logger.warn(`Unknown job name: ${(job as any).name}`);
    }
  }

  private async handleRequestReceived(data: { requestId: string }) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: data.requestId },
      include: {
        book: { include: { owner: true } },
        requester: true,
      },
    });
    if (!request) return;

    await this.notificationsService.sendPush(
      request.book.ownerId,
      'REQUEST_RECEIVED',
      'New Borrow Request',
      `${request.requester.name} wants to borrow "${request.book.title}"`,
      {
        requestId: request.id,
        bookId: request.bookId,
        type: 'REQUEST_RECEIVED',
      },
    );
  }

  private async handleRequestAccepted(data: { requestId: string }) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: data.requestId },
      include: { book: true, requester: true },
    });
    if (!request) return;

    await this.notificationsService.sendPush(
      request.requesterId,
      'REQUEST_ACCEPTED',
      'Request Accepted 🎉',
      `Your request for "${request.book.title}" was accepted!`,
      {
        requestId: request.id,
        bookId: request.bookId,
        type: 'REQUEST_ACCEPTED',
      },
    );
  }

  private async handleRequestRejected(data: { requestId: string }) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: data.requestId },
      include: { book: true, requester: true },
    });
    if (!request) return;

    await this.notificationsService.sendPush(
      request.requesterId,
      'REQUEST_REJECTED',
      'Request Not Accepted',
      `Your request for "${request.book.title}" was not accepted.`,
      {
        requestId: request.id,
        bookId: request.bookId,
        type: 'REQUEST_REJECTED',
      },
    );
  }

  private async handleRequestReturned(data: { requestId: string }) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: data.requestId },
      include: { book: { include: { owner: true } }, requester: true },
    });
    if (!request) return;

    await this.notificationsService.sendPush(
      request.requesterId,
      'REQUEST_ACCEPTED', // Map to generic type that navigates to 'Requests' or we can add a new type. 'REQUEST_RETURNED' isn't handled by the UI right now, so use REQUEST_ACCEPTED to go to Requests screen
      'Return Confirmed ✅',
      `${request.book.owner.name} confirmed the return of "${request.book.title}". Leave a review!`,
      {
        requestId: request.id,
        bookId: request.bookId,
        type: 'REQUEST_ACCEPTED',
      },
    );
  }

  private async handleNewMessage(data: {
    chatId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    content: string;
  }) {
    const preview =
      data.content.length > 60
        ? data.content.slice(0, 57) + '...'
        : data.content;

    await this.notificationsService.sendPush(
      data.recipientId,
      'NEW_MESSAGE',
      data.senderName,
      preview,
      {
        type: 'NEW_MESSAGE',
        chatId: data.chatId,
        senderId: data.senderId,
        senderName: data.senderName
      },
    );
  }

  // ── Cron Jobs ──────────────────────────────────────────────────────────────

  @Cron('0 8 * * *') // Every day at 08:00
  async handleDueSoonAndOverdue() {
    this.logger.log('Running daily due_soon / overdue cron job');

    const now = new Date();
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    const acceptedRequests = await this.prisma.borrowRequest.findMany({
      where: {
        status: BorrowRequestStatus.ACCEPTED,
        dueDate: { not: null },
      },
      include: { book: true, requester: true },
    });

    for (const req of acceptedRequests) {
      // Idempotency check: don't notify if notified in the last 20 hours
      if (
        req.lastNotifiedAt &&
        new Date(req.lastNotifiedAt) > twentyHoursAgo
      ) {
        continue;
      }

      const dueDate = new Date(req.dueDate!);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // rounding up to get calendar days

      let notified = false;

      if (daysLeft === 3) {
        await this.notificationsService.sendPush(
          req.requesterId,
          'DUE_SOON',
          'Return Reminder 📚',
          `"${req.book.title}" is due back in 3 days`,
          { requestId: req.id, bookId: req.bookId, type: 'DUE_SOON' },
        );
        notified = true;
      } else if (daysLeft === 1) {
        await this.notificationsService.sendPush(
          req.requesterId,
          'DUE_SOON',
          'Return Reminder 📚',
          `Tomorrow is the last day to return "${req.book.title}"`,
          { requestId: req.id, bookId: req.bookId, type: 'DUE_SOON' },
        );
        notified = true;
      } else if (daysLeft <= 0) {
        // Change request and book status to OVERDUE
        await this.prisma.$transaction([
          this.prisma.borrowRequest.update({
            where: { id: req.id },
            data: { status: BorrowRequestStatus.OVERDUE },
          }),
          this.prisma.book.update({
            where: { id: req.bookId },
            data: { status: BookStatus.OVERDUE },
          }),
        ]);

        // Notify borrower
        await this.notificationsService.sendPush(
          req.requesterId,
          'OVERDUE',
          'Book Overdue ⚠️',
          `"${req.book.title}" is overdue. Please return it as soon as possible.`,
          { requestId: req.id, bookId: req.bookId, type: 'OVERDUE' },
        );

        // Notify lender
        await this.notificationsService.sendPush(
          req.book.ownerId,
          'OVERDUE',
          'Book Not Returned',
          `${req.requester.name} hasn't returned "${req.book.title}" yet.`,
          { requestId: req.id, bookId: req.bookId, type: 'OVERDUE' },
        );
        notified = true;
      }

      if (notified) {
        await this.prisma.borrowRequest.update({
          where: { id: req.id },
          data: { lastNotifiedAt: now },
        });
      }
    }
  }
}
