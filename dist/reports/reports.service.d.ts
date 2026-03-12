import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto, ReportAction } from './dto';
import { ReportTargetType, ReportStatus } from '@prisma/client';
export declare class ReportsService {
    private prisma;
    private notifications;
    private readonly moderationQueue;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService, moderationQueue: Queue);
    create(reporterId: string, dto: CreateReportDto): Promise<{
        report: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.ReportStatus;
            targetType: import(".prisma/client").$Enums.ReportTargetType;
            targetId: string;
            reason: import(".prisma/client").$Enums.ReportReason;
            details: string | null;
            reporterId: string;
        };
        autoHidden: boolean;
    }>;
    findAll(status?: ReportStatus, targetType?: ReportTargetType, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    handleAction(reportId: string, action: ReportAction, adminId: string): Promise<{
        success: boolean;
        action: ReportAction;
    }>;
    private validateTarget;
    private incrementReportCount;
    private decrementReportCount;
    private setHidden;
    private resolveTargetUserId;
    private enrichReport;
}
