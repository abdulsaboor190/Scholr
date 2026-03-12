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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const bullmq_3 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const notifications_service_1 = require("./notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor extends bullmq_1.WorkerHost {
    notificationsService;
    prisma;
    notificationQueue;
    logger = new common_1.Logger(NotificationProcessor_1.name);
    constructor(notificationsService, prisma, notificationQueue) {
        super();
        this.notificationsService = notificationsService;
        this.prisma = prisma;
        this.notificationQueue = notificationQueue;
    }
    async process(job) {
        this.logger.log(`Processing job: ${job.name} [${job.id}]`);
        switch (job.name) {
            case 'request.received':
                await this.handleRequestReceived(job.data);
                break;
            case 'request.accepted':
                await this.handleRequestAccepted(job.data);
                break;
            case 'request.rejected':
                await this.handleRequestRejected(job.data);
                break;
            case 'request.returned':
                await this.handleRequestReturned(job.data);
                break;
            case 'message.new':
                await this.handleNewMessage(job.data);
                break;
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
    async handleRequestReceived(data) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: data.requestId },
            include: {
                book: { include: { owner: true } },
                requester: true,
            },
        });
        if (!request)
            return;
        await this.notificationsService.sendPush(request.book.ownerId, 'REQUEST_RECEIVED', 'New Borrow Request', `${request.requester.name} wants to borrow "${request.book.title}"`, {
            requestId: request.id,
            bookId: request.bookId,
            type: 'REQUEST_RECEIVED',
        });
    }
    async handleRequestAccepted(data) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: data.requestId },
            include: { book: true, requester: true },
        });
        if (!request)
            return;
        await this.notificationsService.sendPush(request.requesterId, 'REQUEST_ACCEPTED', 'Request Accepted 🎉', `Your request for "${request.book.title}" was accepted!`, {
            requestId: request.id,
            bookId: request.bookId,
            type: 'REQUEST_ACCEPTED',
        });
    }
    async handleRequestRejected(data) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: data.requestId },
            include: { book: true, requester: true },
        });
        if (!request)
            return;
        await this.notificationsService.sendPush(request.requesterId, 'REQUEST_REJECTED', 'Request Not Accepted', `Your request for "${request.book.title}" was not accepted.`, {
            requestId: request.id,
            bookId: request.bookId,
            type: 'REQUEST_REJECTED',
        });
    }
    async handleRequestReturned(data) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: data.requestId },
            include: { book: { include: { owner: true } }, requester: true },
        });
        if (!request)
            return;
        await this.notificationsService.sendPush(request.requesterId, 'REQUEST_ACCEPTED', 'Return Confirmed ✅', `${request.book.owner.name} confirmed the return of "${request.book.title}". Leave a review!`, {
            requestId: request.id,
            bookId: request.bookId,
            type: 'REQUEST_ACCEPTED',
        });
    }
    async handleNewMessage(data) {
        const preview = data.content.length > 60
            ? data.content.slice(0, 57) + '...'
            : data.content;
        await this.notificationsService.sendPush(data.recipientId, 'NEW_MESSAGE', data.senderName, preview, {
            type: 'NEW_MESSAGE',
            chatId: data.chatId,
            senderId: data.senderId,
            senderName: data.senderName
        });
    }
    async handleDueSoonAndOverdue() {
        this.logger.log('Running daily due_soon / overdue cron job');
        const now = new Date();
        const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
        const acceptedRequests = await this.prisma.borrowRequest.findMany({
            where: {
                status: client_1.BorrowRequestStatus.ACCEPTED,
                dueDate: { not: null },
            },
            include: { book: true, requester: true },
        });
        for (const req of acceptedRequests) {
            if (req.lastNotifiedAt &&
                new Date(req.lastNotifiedAt) > twentyHoursAgo) {
                continue;
            }
            const dueDate = new Date(req.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            let notified = false;
            if (daysLeft === 3) {
                await this.notificationsService.sendPush(req.requesterId, 'DUE_SOON', 'Return Reminder 📚', `"${req.book.title}" is due back in 3 days`, { requestId: req.id, bookId: req.bookId, type: 'DUE_SOON' });
                notified = true;
            }
            else if (daysLeft === 1) {
                await this.notificationsService.sendPush(req.requesterId, 'DUE_SOON', 'Return Reminder 📚', `Tomorrow is the last day to return "${req.book.title}"`, { requestId: req.id, bookId: req.bookId, type: 'DUE_SOON' });
                notified = true;
            }
            else if (daysLeft <= 0) {
                await this.prisma.$transaction([
                    this.prisma.borrowRequest.update({
                        where: { id: req.id },
                        data: { status: client_1.BorrowRequestStatus.OVERDUE },
                    }),
                    this.prisma.book.update({
                        where: { id: req.bookId },
                        data: { status: client_1.BookStatus.OVERDUE },
                    }),
                ]);
                await this.notificationsService.sendPush(req.requesterId, 'OVERDUE', 'Book Overdue ⚠️', `"${req.book.title}" is overdue. Please return it as soon as possible.`, { requestId: req.id, bookId: req.bookId, type: 'OVERDUE' });
                await this.notificationsService.sendPush(req.book.ownerId, 'OVERDUE', 'Book Not Returned', `${req.requester.name} hasn't returned "${req.book.title}" yet.`, { requestId: req.id, bookId: req.bookId, type: 'OVERDUE' });
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
};
exports.NotificationProcessor = NotificationProcessor;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "handleDueSoonAndOverdue", null);
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications'),
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_3.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        prisma_service_1.PrismaService,
        bullmq_2.Queue])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map