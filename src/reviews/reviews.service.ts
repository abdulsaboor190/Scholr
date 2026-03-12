import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';
import { BorrowRequestStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) { }

  async create(reviewerId: string, dto: CreateReviewDto) {
    // 1. Fetch the transaction (borrow request)
    const transaction = await this.prisma.borrowRequest.findUnique({
      where: { id: dto.transactionId },
      include: { book: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // 2. Must be returned to review
    if (transaction.status !== BorrowRequestStatus.RETURNED) {
      throw new BadRequestException(
        'You can only review completed (returned) transactions',
      );
    }

    // 3. Reviewer must be borrower or lender
    const isLender = transaction.book.ownerId === reviewerId;
    const isBorrower = transaction.requesterId === reviewerId;
    if (!isLender && !isBorrower) {
      throw new ForbiddenException(
        'You were not a party to this transaction',
      );
    }

    // 4. Determine reviewee
    const revieweeId = isLender
      ? transaction.requesterId
      : transaction.book.ownerId;

    // 5. One review per person per transaction (also enforced at DB level)
    const existing = await this.prisma.review.findUnique({
      where: {
        transactionId_reviewerId: {
          transactionId: dto.transactionId,
          reviewerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You have already submitted a review for this transaction',
      );
    }

    // 6. Create review
    const review = await this.prisma.review.create({
      data: {
        transactionId: dto.transactionId,
        reviewerId,
        revieweeId,
        bookId: transaction.bookId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // 7. Recalculate reviewee's average_rating and review_count
    await this.recalculateUserRating(revieweeId);

    return review;
  }

  async findByUser(
    targetUserId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: targetUserId },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          book: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { revieweeId: targetUserId } }),
    ]);

    return { items, total, page, limit };
  }

  async findByBook(bookId: string) {
    return this.prisma.review.findMany({
      where: { bookId },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingForUser(userId: string) {
    // Fetch all returned transactions where the user was involved
    const transactions = await this.prisma.borrowRequest.findMany({
      where: {
        status: BorrowRequestStatus.RETURNED,
        OR: [
          { requesterId: userId },
          { book: { ownerId: userId } },
        ],
        updatedAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        requester: { select: { id: true, name: true, avatarUrl: true } },
        reviews: { where: { reviewerId: userId } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter out ones already reviewed by this user
    const pending = transactions.filter((t) => t.reviews.length === 0);

    return pending.map((t) => {
      const isLender = t.book.ownerId === userId;
      const otherParty = isLender ? t.requester : t.book.owner;
      return {
        id: t.id,
        transactionId: t.id,
        book: {
          id: t.bookId,
          title: t.book.title,
          imageUrl: t.book.imageUrl,
        },
        otherParty,
      };
    });
  }

  private async recalculateUserRating(userId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: agg._avg.rating ?? null,
        reviewCount: agg._count.id,
      },
    });
  }
}
