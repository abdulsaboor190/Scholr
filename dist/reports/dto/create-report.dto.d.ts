import { ReportTargetType, ReportReason } from '@prisma/client';
export declare class CreateReportDto {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
}
