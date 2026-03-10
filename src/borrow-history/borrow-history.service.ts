import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BorrowRequestStatus } from '@prisma/client';

@Injectable()
export class BorrowHistoryService {
  constructor(private prisma: PrismaService) {}

  async getBorrowerHistory(userId: string) {
    return this.prisma.borrowRequest.findMany({
      where: {
        requesterId: userId,
        status: {
          in: [BorrowRequestStatus.ACCEPTED, BorrowRequestStatus.RETURNED],
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

  async getLenderHistory(userId: string) {
    return this.prisma.borrowRequest.findMany({
      where: {
        book: { ownerId: userId },
        status: {
          in: [BorrowRequestStatus.ACCEPTED, BorrowRequestStatus.RETURNED],
        },
      },
      include: {
        book: true,
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
