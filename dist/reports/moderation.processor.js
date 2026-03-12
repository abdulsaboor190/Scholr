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
var ModerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const ioredis_1 = require("ioredis");
let ModerationProcessor = ModerationProcessor_1 = class ModerationProcessor extends bullmq_1.WorkerHost {
    prisma;
    notifications;
    redis;
    logger = new common_1.Logger(ModerationProcessor_1.name);
    constructor(prisma, notifications, redis) {
        super();
        this.prisma = prisma;
        this.notifications = notifications;
        this.redis = redis;
    }
    async process(job) {
        this.logger.log(`Processing moderation job: ${job.name} [${job.id}]`);
        switch (job.name) {
            case 'auto.hidden':
                await this.handleAutoHidden(job.data);
                break;
            case 'suspend.user':
                await this.handleSuspendUser(job.data);
                break;
            default:
                this.logger.warn(`Unknown moderation job: ${job.name}`);
        }
    }
    async handleAutoHidden(data) {
        this.logger.warn(`Content auto-hidden: ${data.targetType}:${data.targetId} (Reports: ${data.reportCount})`);
    }
    async handleSuspendUser(data) {
        await this.redis.del(`refresh_token:${data.userId}`);
        this.logger.log(`Invalidated sessions for suspended user ${data.userId}`);
    }
};
exports.ModerationProcessor = ModerationProcessor;
exports.ModerationProcessor = ModerationProcessor = ModerationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('moderation'),
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        ioredis_1.Redis])
], ModerationProcessor);
//# sourceMappingURL=moderation.processor.js.map