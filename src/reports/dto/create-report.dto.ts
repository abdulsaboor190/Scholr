import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportTargetType, ReportReason } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsString()
  targetId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
