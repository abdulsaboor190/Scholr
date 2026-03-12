import { ReportsService } from './reports.service';
import { CreateReportDto, ReportActionDto } from './dto';
import { ReportStatus, ReportTargetType } from '@prisma/client';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    create(userId: string, dto: CreateReportDto): Promise<{
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
    findAll(status?: ReportStatus, targetType?: ReportTargetType, page?: string, limit?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    handleAction(reportId: string, dto: ReportActionDto, adminId: string): Promise<{
        success: boolean;
        action: import("./dto").ReportAction;
    }>;
}
