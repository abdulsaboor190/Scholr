import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto';
import { AccountStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  // ─── Public admin login (no AdminGuard for this route) ──────────────────
  // We override via a separate public endpoint in AuthController, but we
  // expose it here too for clarity — it's handled in auth.controller.ts

  // ─── Stats ───────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('status') status?: AccountStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(
      search,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('users/:id')
  getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: AccountStatus,
  ) {
    return this.adminService.updateUserStatus(userId, status);
  }

  // ─── Books ───────────────────────────────────────────────────────────────

  @Get('books')
  getBooks(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('isHidden') isHidden?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const hiddenFilter =
      isHidden === 'true' ? true : isHidden === 'false' ? false : undefined;

    return this.adminService.getBooks(
      search,
      status,
      hiddenFilter,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('books/:id/hidden')
  toggleBookHidden(
    @Param('id') bookId: string,
    @Body('isHidden') isHidden: boolean,
  ) {
    return this.adminService.toggleBookHidden(bookId, isHidden);
  }
}
