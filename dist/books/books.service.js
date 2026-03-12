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
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BooksService = class BooksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        return this.prisma.book.create({
            data: {
                ...dto,
                imageUrls: [],
                ownerId: userId,
            },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.subject) {
            where.subject = { equals: filters.subject, mode: 'insensitive' };
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.ownerId) {
            where.ownerId = filters.ownerId;
        }
        return this.prisma.book.findMany({
            where,
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const book = await this.prisma.book.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
                reviews: {
                    include: {
                        reviewer: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        return book;
    }
    async update(id, userId, dto) {
        const book = await this.prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.ownerId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own books');
        }
        return this.prisma.book.update({
            where: { id },
            data: { ...dto },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async remove(id, userId) {
        const book = await this.prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.ownerId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own books');
        }
        await this.prisma.book.delete({ where: { id } });
        return { message: 'Book deleted successfully' };
    }
    async uploadBookImage(id, userId, imageUrl) {
        const book = await this.prisma.book.findUnique({ where: { id } });
        if (!book) {
            throw new common_1.NotFoundException('Book not found');
        }
        if (book.ownerId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own books');
        }
        const updateData = {
            imageUrls: { push: imageUrl },
        };
        if (!book.imageUrl) {
            updateData.imageUrl = imageUrl;
        }
        return this.prisma.book.update({
            where: { id },
            data: updateData,
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BooksService);
//# sourceMappingURL=books.service.js.map