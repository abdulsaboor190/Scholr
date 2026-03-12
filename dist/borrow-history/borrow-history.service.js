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
exports.BorrowHistoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BorrowHistoryService = class BorrowHistoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBorrowerHistory(userId) {
        return this.prisma.borrowRequest.findMany({
            where: {
                requesterId: userId,
                status: {
                    in: [client_1.BorrowRequestStatus.ACCEPTED, client_1.BorrowRequestStatus.RETURNED],
                },
            },
            include: {
                book: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getLenderHistory(userId) {
        return this.prisma.borrowRequest.findMany({
            where: {
                book: { ownerId: userId },
                status: {
                    in: [client_1.BorrowRequestStatus.ACCEPTED, client_1.BorrowRequestStatus.RETURNED],
                },
            },
            include: {
                book: true,
                requester: { select: { id: true, name: true, email: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
};
exports.BorrowHistoryService = BorrowHistoryService;
exports.BorrowHistoryService = BorrowHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BorrowHistoryService);
//# sourceMappingURL=borrow-history.service.js.map