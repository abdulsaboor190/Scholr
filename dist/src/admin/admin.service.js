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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [dailyActiveUsers, totalBooksListed, borrowRequestsSent, allAccepted, completedRequests, pendingReports, suspendedUsers, dailyBorrowRequests, dailyRegistrations,] = await Promise.all([
            this.prisma.user.count({
                where: { lastActiveAt: { gte: oneDayAgo } },
            }),
            this.prisma.book.count({ where: { isHidden: false } }),
            this.prisma.borrowRequest.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            this.prisma.borrowRequest.count({ where: { status: 'ACCEPTED' } }),
            this.prisma.borrowRequest.count({ where: { status: 'RETURNED' } }),
            this.prisma.report.count({ where: { status: 'PENDING' } }),
            this.prisma.user.count({
                where: { accountStatus: client_1.AccountStatus.SUSPENDED },
            }),
            this.getDailyBorrowRequests(14),
            this.getDailyRegistrations(14),
        ]);
        const completionRate = allAccepted + completedRequests > 0
            ? Math.round((completedRequests / (allAccepted + completedRequests)) * 100)
            : 0;
        return {
            dailyActiveUsers,
            totalBooksListed,
            borrowRequestsSent,
            completionRate,
            pendingReports,
            suspendedUsers,
            charts: {
                dailyBorrowRequests,
                dailyRegistrations,
            },
        };
    }
    async getDailyBorrowRequests(days) {
        const results = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            const count = await this.prisma.borrowRequest.count({
                where: { createdAt: { gte: start, lte: end } },
            });
            results.push({ date: start.toISOString().split('T')[0], count });
        }
        return results;
    }
    async getDailyRegistrations(days) {
        const results = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            const count = await this.prisma.user.count({
                where: { createdAt: { gte: start, lte: end } },
            });
            results.push({ date: start.toISOString().split('T')[0], count });
        }
        return results;
    }
    async getUsers(search, status, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.accountStatus = status;
        }
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    accountStatus: true,
                    averageRating: true,
                    reviewCount: true,
                    reportCount: true,
                    createdAt: true,
                    _count: { select: { books: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async getUserDetails(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                books: {
                    where: { isHidden: false },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                reviewsReceived: {
                    include: {
                        reviewer: { select: { id: true, name: true, avatarUrl: true } },
                        book: { select: { id: true, title: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateUserStatus(userId, status) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { accountStatus: status },
            select: { id: true, name: true, accountStatus: true },
        });
    }
    async getBooks(search, status, isHidden, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { owner: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status)
            where.status = status;
        if (isHidden !== undefined)
            where.isHidden = isHidden;
        const [items, total] = await Promise.all([
            this.prisma.book.findMany({
                where,
                include: {
                    owner: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.book.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async toggleBookHidden(bookId, isHidden) {
        return this.prisma.book.update({
            where: { id: bookId },
            data: { isHidden },
            select: { id: true, title: true, isHidden: true },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map