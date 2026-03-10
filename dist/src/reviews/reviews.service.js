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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(reviewerId, dto) {
        const transaction = await this.prisma.borrowRequest.findUnique({
            where: { id: dto.transactionId },
            include: { book: true },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (transaction.status !== client_1.BorrowRequestStatus.RETURNED) {
            throw new common_1.BadRequestException('You can only review completed (returned) transactions');
        }
        const isLender = transaction.book.ownerId === reviewerId;
        const isBorrower = transaction.requesterId === reviewerId;
        if (!isLender && !isBorrower) {
            throw new common_1.ForbiddenException('You were not a party to this transaction');
        }
        const revieweeId = isLender
            ? transaction.requesterId
            : transaction.book.ownerId;
        const existing = await this.prisma.review.findUnique({
            where: {
                transactionId_reviewerId: {
                    transactionId: dto.transactionId,
                    reviewerId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('You have already submitted a review for this transaction');
        }
        const review = await this.prisma.review.create({
            data: {
                transactionId: dto.transactionId,
                reviewerId,
                revieweeId,
                bookId: transaction.bookId,
                rating: dto.rating,
                comment: dto.comment,
            },
        });
        await this.recalculateUserRating(revieweeId);
        return review;
    }
    async findByUser(targetUserId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { revieweeId: targetUserId },
                include: {
                    reviewer: { select: { id: true, name: true, avatarUrl: true } },
                    book: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.review.count({ where: { revieweeId: targetUserId } }),
        ]);
        return { items, total, page, limit };
    }
    async getPendingForUser(userId) {
        const transactions = await this.prisma.borrowRequest.findMany({
            where: {
                status: client_1.BorrowRequestStatus.RETURNED,
                OR: [
                    { requesterId: userId },
                    { book: { ownerId: userId } },
                ],
                updatedAt: {
                    gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
                },
            },
            include: {
                book: {
                    include: {
                        owner: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
                requester: { select: { id: true, name: true, avatarUrl: true } },
                reviews: { where: { reviewerId: userId } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const pending = transactions.filter((t) => t.reviews.length === 0);
        return pending.map((t) => {
            const isLender = t.book.ownerId === userId;
            const otherParty = isLender ? t.requester : t.book.owner;
            return {
                id: t.id,
                transactionId: t.id,
                book: {
                    id: t.bookId,
                    title: t.book.title,
                    imageUrl: t.book.imageUrl,
                },
                otherParty,
            };
        });
    }
    async recalculateUserRating(userId) {
        const agg = await this.prisma.review.aggregate({
            where: { revieweeId: userId },
            _avg: { rating: true },
            _count: { id: true },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                averageRating: agg._avg.rating ?? null,
                reviewCount: agg._count.id,
            },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map