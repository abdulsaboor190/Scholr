import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, ReportActionDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { ReportStatus, ReportTargetType } from '@prisma/client';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(userId, dto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll(
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: ReportTargetType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.findAll(
      status,
      targetType,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch(':id/action')
  @UseGuards(AdminGuard)
  handleAction(
    @Param('id') reportId: string,
    @Body() dto: ReportActionDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.reportsService.handleAction(reportId, dto.action, adminId);
  }
}
