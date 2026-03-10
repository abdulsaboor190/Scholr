import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto, ReportAction } from './dto';
import {
  ReportTargetType,
  ReportStatus,
  AccountStatus,
  NotificationType,
} from '@prisma/client';

const AUTO_HIDE_THRESHOLD = 3;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    // 1. Validate target exists + prevent self-reporting
    await this.validateTarget(dto.targetType, dto.targetId, reporterId);

    // 2. Prevent duplicate reports (unique constraint also enforced at DB level)
    const existing = await this.prisma.report.findUnique({
      where: {
        reporterId_targetType_targetId: {
          reporterId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already reported this content',
      );
    }

    // 3. Create the report
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    // 4. Increment report_count and maybe auto-hide
    const newCount = await this.incrementReportCount(
      dto.targetType,
      dto.targetId,
    );

    let autoHidden = false;
    if (newCount >= AUTO_HIDE_THRESHOLD) {
      await this.setHidden(dto.targetType, dto.targetId, true);
      autoHidden = true;

      // Enqueue moderation alert
      await this.moderationQueue.add(
        'auto.hidden',
        {
          targetType: dto.targetType,
          targetId: dto.targetId,
          reportCount: newCount,
        },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );

      this.logger.log(
        `Auto-hidden ${dto.targetType}:${dto.targetId} after ${newCount} reports`,
      );
    }

    return { report, autoHidden };
  }

  async findAll(
    status?: ReportStatus,
    targetType?: ReportTargetType,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    // Enrich each report with the target's content
    const enriched = await Promise.all(
      items.map((r) => this.enrichReport(r)),
    );

    return { items: enriched, total, page, limit };
  }

  async handleAction(
    reportId: string,
    action: ReportAction,
    adminId: string,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    switch (action) {
      case ReportAction.REMOVE:
        await this.setHidden(report.targetType, report.targetId, true);
        await this.prisma.report.update({
          where: { id: reportId },
          data: { status: ReportStatus.REVIEWED },
        });
        break;

      case ReportAction.WARN: {
        const userId = await this.resolveTargetUserId(
          report.targetType,
          report.targetId,
        );
        await this.prisma.user.update({
          where: { id: userId },
          data: { accountStatus: AccountStatus.WARNED },
        });
        await this.notifications.sendPush(
          userId,
          NotificationType.ACCOUNT_WARNING,
          '⚠️ Account Warning',
          'Your account has received a warning. Please review our community guidelines.',
        );
        await this.prisma.report.update({
          where: { id: reportId },
          data: { status: ReportStatus.REVIEWED },
        });
        break;
      }

      case ReportAction.SUSPEND: {
        const userId = await this.resolveTargetUserId(
          report.targetType,
          report.targetId,
        );
        await this.prisma.user.update({
          where: { id: userId },
          data: { accountStatus: AccountStatus.SUSPENDED },
        });
        // Invalidate all sessions by deleting refresh token from Redis
        // We inject a "suspend" job so the queue handles Redis deletion
        await this.moderationQueue.add(
          'suspend.user',
          { userId },
          { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        );
        await this.notifications.sendPush(
          userId,
          NotificationType.ACCOUNT_SUSPENDED,
          '🚫 Account Suspended',
          'Your account has been suspended due to violations of our community guidelines.',
        );
        await this.prisma.report.update({
          where: { id: reportId },
          data: { status: ReportStatus.REVIEWED },
        });
        break;
      }

      case ReportAction.DISMISS: {
        await this.prisma.report.update({
          where: { id: reportId },
          data: { status: ReportStatus.DISMISSED },
        });
        const newCount = await this.decrementReportCount(
          report.targetType,
          report.targetId,
        );
        if (newCount < AUTO_HIDE_THRESHOLD) {
          await this.setHidden(report.targetType, report.targetId, false);
        }
        break;
      }
    }

    // Log the admin action
    await this.prisma.adminAction.create({
      data: {
        adminId,
        reportId,
        action,
        targetType: report.targetType,
        targetId: report.targetId,
      },
    });

    return { success: true, action };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async validateTarget(
    targetType: ReportTargetType,
    targetId: string,
    reporterId: string,
  ) {
    switch (targetType) {
      case ReportTargetType.BOOK: {
        const book = await this.prisma.book.findUnique({
          where: { id: targetId },
        });
        if (!book) throw new NotFoundException('Book not found');
        if (book.ownerId === reporterId)
          throw new BadRequestException('You cannot report your own book');
        break;
      }
      case ReportTargetType.MESSAGE: {
        const msg = await this.prisma.message.findUnique({
          where: { id: targetId },
        });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.senderId === reporterId)
          throw new BadRequestException('You cannot report your own message');
        break;
      }
      case ReportTargetType.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.id === reporterId)
          throw new BadRequestException('You cannot report yourself');
        break;
      }
    }
  }

  private async incrementReportCount(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<number> {
    if (targetType === ReportTargetType.BOOK) {
      const updated = await this.prisma.book.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
        select: { reportCount: true },
      });
      return updated.reportCount;
    }
    if (targetType === ReportTargetType.USER) {
      const updated = await this.prisma.user.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
        select: { reportCount: true },
      });
      return updated.reportCount;
    }
    // MESSAGE — no reportCount column but we still track in reports table
    const count = await this.prisma.report.count({
      where: { targetType, targetId },
    });
    return count;
  }

  private async decrementReportCount(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<number> {
    if (targetType === ReportTargetType.BOOK) {
      const updated = await this.prisma.book.update({
        where: { id: targetId },
        data: { reportCount: { decrement: 1 } },
        select: { reportCount: true },
      });
      return Math.max(0, updated.reportCount);
    }
    if (targetType === ReportTargetType.USER) {
      const updated = await this.prisma.user.update({
        where: { id: targetId },
        data: { reportCount: { decrement: 1 } },
        select: { reportCount: true },
      });
      return Math.max(0, updated.reportCount);
    }
    const count = await this.prisma.report.count({
      where: { targetType, targetId, status: ReportStatus.PENDING },
    });
    return count;
  }

  private async setHidden(
    targetType: ReportTargetType,
    targetId: string,
    hidden: boolean,
  ) {
    if (targetType === ReportTargetType.BOOK) {
      await this.prisma.book.update({
        where: { id: targetId },
        data: { isHidden: hidden },
      });
    } else if (targetType === ReportTargetType.MESSAGE) {
      await this.prisma.message.update({
        where: { id: targetId },
        data: { isHidden: hidden },
      });
    }
    // Users don't have is_hidden; account_status handles that
  }

  private async resolveTargetUserId(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string> {
    if (targetType === ReportTargetType.USER) return targetId;
    if (targetType === ReportTargetType.BOOK) {
      const book = await this.prisma.book.findUnique({
        where: { id: targetId },
        select: { ownerId: true },
      });
      if (!book) throw new NotFoundException('Book not found');
      return book.ownerId;
    }
    if (targetType === ReportTargetType.MESSAGE) {
      const msg = await this.prisma.message.findUnique({
        where: { id: targetId },
        select: { senderId: true },
      });
      if (!msg) throw new NotFoundException('Message not found');
      return msg.senderId;
    }
    throw new BadRequestException('Unknown target type');
  }

  private async enrichReport(report: any) {
    let targetContent: any = null;
    let reportCountOnTarget = 0;

    if (report.targetType === ReportTargetType.BOOK) {
      const book = await this.prisma.book.findUnique({
        where: { id: report.targetId },
        include: { owner: { select: { id: true, name: true } } },
      });
      targetContent = book;
      reportCountOnTarget = book?.reportCount ?? 0;
    } else if (report.targetType === ReportTargetType.MESSAGE) {
      const msg = await this.prisma.message.findUnique({
        where: { id: report.targetId },
        include: {
          sender: { select: { id: true, name: true } },
          chat: { select: { id: true } },
        },
      });
      targetContent = msg;
      // count pending reports for this message
      reportCountOnTarget = await this.prisma.report.count({
        where: { targetType: report.targetType, targetId: report.targetId },
      });
    } else if (report.targetType === ReportTargetType.USER) {
      const user = await this.prisma.user.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          accountStatus: true,
          reportCount: true,
        },
      });
      targetContent = user;
      reportCountOnTarget = user?.reportCount ?? 0;
    }

    return { ...report, targetContent, reportCountOnTarget };
  }
}
