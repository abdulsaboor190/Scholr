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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    expo = new expo_server_sdk_1.default();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendPush(userId, type, title, body, data = {}) {
        const notification = await this.prisma.notification.create({
            data: { userId, type, title, body, data: data },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true },
        });
        if (!user?.pushToken) {
            this.logger.debug(`No push token for user ${userId}, skipping push.`);
            return notification;
        }
        if (!expo_server_sdk_1.default.isExpoPushToken(user.pushToken)) {
            this.logger.warn(`Invalid Expo push token for user ${userId}: ${user.pushToken}`);
            return notification;
        }
        const message = {
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
                        this.logger.warn(`Push error for user ${userId}: ${receipt.message}`);
                    }
                });
            }
            this.logger.log(`Push sent to user ${userId}: "${title}"`);
        }
        catch (err) {
            this.logger.error(`Failed to send push to user ${userId}: ${err.message}`);
        }
        return notification;
    }
    async listForUser(userId, page = 1, limit = 20) {
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
    async markRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAllRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map