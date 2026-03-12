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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowRequestsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BorrowRequestsService = class BorrowRequestsService {
    prisma;
    notificationQueue;
    constructor(prisma, notificationQueue) {
        this.prisma = prisma;
        this.notificationQueue = notificationQueue;
    }
    async create(requesterId, dto) {
        const book = await this.prisma.book.findUnique({
            where: { id: dto.bookId },
        });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.ownerId === requesterId) {
            throw new common_1.BadRequestException('You cannot borrow your own book');
        }
        if (book.status === client_1.BookStatus.BORROWED) {
            throw new common_1.BadRequestException('This book is currently borrowed');
        }
        const existingRequest = await this.prisma.borrowRequest.findFirst({
            where: {
                bookId: dto.bookId,
                requesterId,
                status: client_1.BorrowRequestStatus.PENDING,
            },
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('You already have a pending request for this book');
        }
        const request = await this.prisma.borrowRequest.create({
            data: {
                bookId: dto.bookId,
                requesterId,
            },
            include: {
                book: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                    },
                },
                requester: { select: { id: true, name: true, email: true } },
            },
        });
        try {
            await this.notificationQueue.add('request.received', { requestId: request.id }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        }
        catch (err) {
            console.error('Failed to add to notification queue:', err);
        }
        return request;
    }
    async accept(requestId, userId) {
        const request = await this.findRequestWithBookOwnerCheck(requestId, userId);
        if (request.status !== client_1.BorrowRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending requests can be accepted');
        }
        const [updatedRequest, , chat] = await this.prisma.$transaction([
            this.prisma.borrowRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.BorrowRequestStatus.ACCEPTED,
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                },
                include: {
                    book: true,
                    requester: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.book.update({
                where: { id: request.bookId },
                data: { status: client_1.BookStatus.BORROWED },
            }),
            this.prisma.chat.upsert({
                where: {
                    requestId_user1Id_user2Id: {
                        requestId,
                        user1Id: request.book.ownerId,
                        user2Id: request.requesterId,
                    },
                },
                update: {},
                create: {
                    requestId,
                    user1Id: request.book.ownerId,
                    user2Id: request.requesterId,
                },
            }),
            this.prisma.borrowRequest.updateMany({
                where: {
                    bookId: request.bookId,
                    id: { not: requestId },
                    status: client_1.BorrowRequestStatus.PENDING,
                },
                data: { status: client_1.BorrowRequestStatus.REJECTED },
            }),
        ]);
        try {
            await this.notificationQueue.add('request.accepted', { requestId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        }
        catch (err) {
            console.error('Failed to add to notification queue:', err);
        }
        return {
            ...updatedRequest,
            chatId: chat.id
        };
    }
    async reject(requestId, userId) {
        const request = await this.findRequestWithBookOwnerCheck(requestId, userId);
        if (request.status !== client_1.BorrowRequestStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending requests can be rejected');
        }
        const updatedRequest = await this.prisma.borrowRequest.update({
            where: { id: requestId },
            data: { status: client_1.BorrowRequestStatus.REJECTED },
            include: {
                book: true,
                requester: { select: { id: true, name: true, email: true } },
            },
        });
        try {
            await this.notificationQueue.add('request.rejected', { requestId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        }
        catch (err) {
            console.error('Failed to add to notification queue:', err);
        }
        return updatedRequest;
    }
    async returnBook(requestId, userId) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: requestId },
            include: { book: true },
        });
        if (!request) {
            throw new common_1.NotFoundException('Borrow request not found');
        }
        if (request.book.ownerId !== userId && request.requesterId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to perform this action');
        }
        if (request.status !== client_1.BorrowRequestStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Only accepted requests can be returned');
        }
        const [updatedRequest] = await this.prisma.$transaction([
            this.prisma.borrowRequest.update({
                where: { id: requestId },
                data: { status: client_1.BorrowRequestStatus.RETURNED },
                include: {
                    book: true,
                    requester: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.book.update({
                where: { id: request.bookId },
                data: { status: client_1.BookStatus.AVAILABLE },
            }),
        ]);
        try {
            await this.notificationQueue.add('request.returned', { requestId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        }
        catch (err) {
            console.error('Failed to add to notification queue:', err);
        }
        return updatedRequest;
    }
    async findMyRequests(userId) {
        return this.prisma.borrowRequest.findMany({
            where: { requesterId: userId },
            include: {
                book: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                    },
                },
                requester: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findReceivedRequests(userId) {
        return this.prisma.borrowRequest.findMany({
            where: { book: { ownerId: userId } },
            include: {
                book: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                    },
                },
                requester: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findRequestWithBookOwnerCheck(requestId, userId) {
        const request = await this.prisma.borrowRequest.findUnique({
            where: { id: requestId },
            include: { book: true },
        });
        if (!request) {
            throw new common_1.NotFoundException('Borrow request not found');
        }
        if (request.book.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the book owner can perform this action');
        }
        return request;
    }
};
exports.BorrowRequestsService = BorrowRequestsService;
exports.BorrowRequestsService = BorrowRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], BorrowRequestsService);
//# sourceMappingURL=borrow-requests.service.js.map