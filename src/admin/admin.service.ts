import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      dailyActiveUsers,
      totalBooksListed,
      borrowRequestsSent,
      allAccepted,
      completedRequests,
      pendingReports,
      suspendedUsers,
      dailyBorrowRequests,
      dailyRegistrations,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { lastActiveAt: { gte: oneDayAgo } },
      }),
      this.prisma.book.count({ where: { isHidden: false } }),
      this.prisma.borrowRequest.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.borrowRequest.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.borrowRequest.count({ where: { status: 'RETURNED' } }),
      (this.prisma as any).report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({
        where: { accountStatus: AccountStatus.SUSPENDED },
      }),
      this.getDailyBorrowRequests(14),
      this.getDailyRegistrations(14),
    ]);

    const completionRate =
      allAccepted + completedRequests > 0
        ? Math.round(
            (completedRequests / (allAccepted + completedRequests)) * 100,
          )
        : 0;

    return {
      dailyActiveUsers,
      totalBooksListed,
      borrowRequestsSent,
      completionRate,
      pendingReports,
      suspendedUsers,
      charts: {
        dailyBorrowRequests,
        dailyRegistrations,
      },
    };
  }

  private async getDailyBorrowRequests(days: number) {
    const results: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const count = await this.prisma.borrowRequest.count({
        where: { createdAt: { gte: start, lte: end } },
      });

      results.push({ date: start.toISOString().split('T')[0], count });
    }

    return results;
  }

  private async getDailyRegistrations(days: number) {
    const results: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const count = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      });

      results.push({ date: start.toISOString().split('T')[0], count });
    }

    return results;
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  async getUsers(
    search?: string,
    status?: AccountStatus,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.accountStatus = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          accountStatus: true,
          averageRating: true,
          reviewCount: true,
          reportCount: true,
          createdAt: true,
          _count: { select: { books: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        books: {
          where: { isHidden: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviewsReceived: {
          include: {
            reviewer: { select: { id: true, name: true, avatarUrl: true } },
            book: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserStatus(userId: string, status: AccountStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status },
      select: { id: true, name: true, accountStatus: true },
    });
  }

  // ─── Books ─────────────────────────────────────────────────────────────────

  async getBooks(
    search?: string,
    status?: string,
    isHidden?: boolean,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (isHidden !== undefined) where.isHidden = isHidden;

    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async toggleBookHidden(bookId: string, isHidden: boolean) {
    return this.prisma.book.update({
      where: { id: bookId },
      data: { isHidden },
      select: { id: true, title: true, isHidden: true },
    });
  }
}
