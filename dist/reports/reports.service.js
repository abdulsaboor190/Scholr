"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const dto_1 = require("./dto");
const client_1 = require("@prisma/client");
const AUTO_HIDE_THRESHOLD = 3;
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    notifications;
    moderationQueue;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma, notifications, moderationQueue) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.moderationQueue = moderationQueue;
    }
    async create(reporterId, dto) {
        await this.validateTarget(dto.targetType, dto.targetId, reporterId);
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
            throw new common_1.ConflictException('You have already reported this content');
        }
        const report = await this.prisma.report.create({
            data: {
                reporterId,
                targetType: dto.targetType,
                targetId: dto.targetId,
                reason: dto.reason,
                details: dto.details,
            },
        });
        const newCount = await this.incrementReportCount(dto.targetType, dto.targetId);
        let autoHidden = false;
        if (newCount >= AUTO_HIDE_THRESHOLD) {
            await this.setHidden(dto.targetType, dto.targetId, true);
            autoHidden = true;
            await this.moderationQueue.add('auto.hidden', {
                targetType: dto.targetType,
                targetId: dto.targetId,
                reportCount: newCount,
            }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
            this.logger.log(`Auto-hidden ${dto.targetType}:${dto.targetId} after ${newCount} reports`);
        }
        return { report, autoHidden };
    }
    async findAll(status, targetType, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (targetType)
            where.targetType = targetType;
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
        const enriched = await Promise.all(items.map((r) => this.enrichReport(r)));
        return { items: enriched, total, page, limit };
    }
    async handleAction(reportId, action, adminId) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        switch (action) {
            case dto_1.ReportAction.REMOVE:
                await this.setHidden(report.targetType, report.targetId, true);
                await this.prisma.report.update({
                    where: { id: reportId },
                    data: { status: client_1.ReportStatus.REVIEWED },
                });
                break;
            case dto_1.ReportAction.WARN: {
                const userId = await this.resolveTargetUserId(report.targetType, report.targetId);
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { accountStatus: client_1.AccountStatus.WARNED },
                });
                await this.notifications.sendPush(userId, client_1.NotificationType.ACCOUNT_WARNING, '⚠️ Account Warning', 'Your account has received a warning. Please review our community guidelines.');
                await this.prisma.report.update({
                    where: { id: reportId },
                    data: { status: client_1.ReportStatus.REVIEWED },
                });
                break;
            }
            case dto_1.ReportAction.SUSPEND: {
                const userId = await this.resolveTargetUserId(report.targetType, report.targetId);
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { accountStatus: client_1.AccountStatus.SUSPENDED },
                });
                await this.moderationQueue.add('suspend.user', { userId }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
                await this.notifications.sendPush(userId, client_1.NotificationType.ACCOUNT_SUSPENDED, '🚫 Account Suspended', 'Your account has been suspended due to violations of our community guidelines.');
                await this.prisma.report.update({
                    where: { id: reportId },
                    data: { status: client_1.ReportStatus.REVIEWED },
                });
                break;
            }
            case dto_1.ReportAction.DISMISS: {
                await this.prisma.report.update({
                    where: { id: reportId },
                    data: { status: client_1.ReportStatus.DISMISSED },
                });
                const newCount = await this.decrementReportCount(report.targetType, report.targetId);
                if (newCount < AUTO_HIDE_THRESHOLD) {
                    await this.setHidden(report.targetType, report.targetId, false);
                }
                break;
            }
        }
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
    async validateTarget(targetType, targetId, reporterId) {
        switch (targetType) {
            case client_1.ReportTargetType.BOOK: {
                const book = await this.prisma.book.findUnique({
                    where: { id: targetId },
                });
                if (!book)
                    throw new common_1.NotFoundException('Book not found');
                if (book.ownerId === reporterId)
                    throw new common_1.BadRequestException('You cannot report your own book');
                break;
            }
            case client_1.ReportTargetType.MESSAGE: {
                const msg = await this.prisma.message.findUnique({
                    where: { id: targetId },
                });
                if (!msg)
                    throw new common_1.NotFoundException('Message not found');
                if (msg.senderId === reporterId)
                    throw new common_1.BadRequestException('You cannot report your own message');
                break;
            }
            case client_1.ReportTargetType.USER: {
                const user = await this.prisma.user.findUnique({
                    where: { id: targetId },
                });
                if (!user)
                    throw new common_1.NotFoundException('User not found');
                if (user.id === reporterId)
                    throw new common_1.BadRequestException('You cannot report yourself');
                break;
            }
        }
    }
    async incrementReportCount(targetType, targetId) {
        if (targetType === client_1.ReportTargetType.BOOK) {
            const updated = await this.prisma.book.update({
                where: { id: targetId },
                data: { reportCount: { increment: 1 } },
                select: { reportCount: true },
            });
            return updated.reportCount;
        }
        if (targetType === client_1.ReportTargetType.USER) {
            const updated = await this.prisma.user.update({
                where: { id: targetId },
                data: { reportCount: { increment: 1 } },
                select: { reportCount: true },
            });
            return updated.reportCount;
        }
        const count = await this.prisma.report.count({
            where: { targetType, targetId },
        });
        return count;
    }
    async decrementReportCount(targetType, targetId) {
        if (targetType === client_1.ReportTargetType.BOOK) {
            const updated = await this.prisma.book.update({
                where: { id: targetId },
                data: { reportCount: { decrement: 1 } },
                select: { reportCount: true },
            });
            return Math.max(0, updated.reportCount);
        }
        if (targetType === client_1.ReportTargetType.USER) {
            const updated = await this.prisma.user.update({
                where: { id: targetId },
                data: { reportCount: { decrement: 1 } },
                select: { reportCount: true },
            });
            return Math.max(0, updated.reportCount);
        }
        const count = await this.prisma.report.count({
            where: { targetType, targetId, status: client_1.ReportStatus.PENDING },
        });
        return count;
    }
    async setHidden(targetType, targetId, hidden) {
        if (targetType === client_1.ReportTargetType.BOOK) {
            await this.prisma.book.update({
                where: { id: targetId },
                data: { isHidden: hidden },
            });
        }
        else if (targetType === client_1.ReportTargetType.MESSAGE) {
            await this.prisma.message.update({
                where: { id: targetId },
                data: { isHidden: hidden },
            });
        }
    }
    async resolveTargetUserId(targetType, targetId) {
        if (targetType === client_1.ReportTargetType.USER)
            return targetId;
        if (targetType === client_1.ReportTargetType.BOOK) {
            const book = await this.prisma.book.findUnique({
                where: { id: targetId },
                select: { ownerId: true },
            });
            if (!book)
                throw new common_1.NotFoundException('Book not found');
            return book.ownerId;
        }
        if (targetType === client_1.ReportTargetType.MESSAGE) {
            const msg = await this.prisma.message.findUnique({
                where: { id: targetId },
                select: { senderId: true },
            });
            if (!msg)
                throw new common_1.NotFoundException('Message not found');
            return msg.senderId;
        }
        throw new common_1.BadRequestException('Unknown target type');
    }
    async enrichReport(report) {
        let targetContent = null;
        let reportCountOnTarget = 0;
        if (report.targetType === client_1.ReportTargetType.BOOK) {
            const book = await this.prisma.book.findUnique({
                where: { id: report.targetId },
                include: { owner: { select: { id: true, name: true } } },
            });
            targetContent = book;
            reportCountOnTarget = book?.reportCount ?? 0;
        }
        else if (report.targetType === client_1.ReportTargetType.MESSAGE) {
            const msg = await this.prisma.message.findUnique({
                where: { id: report.targetId },
                include: {
                    sender: { select: { id: true, name: true } },
                    chat: { select: { id: true } },
                },
            });
            targetContent = msg;
            reportCountOnTarget = await this.prisma.report.count({
                where: { targetType: report.targetType, targetId: report.targetId },
            });
        }
        else if (report.targetType === client_1.ReportTargetType.USER) {
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('moderation')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        bullmq_2.Queue])
], ReportsService);
//# sourceMappingURL=reports.service.js.map