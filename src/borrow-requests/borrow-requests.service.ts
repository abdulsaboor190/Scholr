import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowRequestDto } from './dto';
import { BorrowRequestStatus, BookStatus } from '@prisma/client';

@Injectable()
export class BorrowRequestsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) { }

  async create(requesterId: string, dto: CreateBorrowRequestDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.ownerId === requesterId) {
      throw new BadRequestException('You cannot borrow your own book');
    }

    if (book.status === BookStatus.BORROWED) {
      throw new BadRequestException('This book is currently borrowed');
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.borrowRequest.findFirst({
      where: {
        bookId: dto.bookId,
        requesterId,
        status: BorrowRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request for this book',
      );
    }

    const request = await this.prisma.borrowRequest.create({
      data: {
        bookId: dto.bookId,
        requesterId,
      },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify book owner
    try {
      await this.notificationQueue.add(
        'request.received',
        { requestId: request.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      console.error('Failed to add to notification queue:', err);
    }

    return request;
  }

  async accept(requestId: string, userId: string) {
    const request = await this.findRequestWithBookOwnerCheck(requestId, userId);

    if (request.status !== BorrowRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be accepted');
    }

    // Use a transaction to accept request, update book status, and create chat
    const [updatedRequest, , chat] = await this.prisma.$transaction([
      this.prisma.borrowRequest.update({
        where: { id: requestId },
        data: {
          status: BorrowRequestStatus.ACCEPTED,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
        include: {
          book: true,
          requester: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: request.bookId },
        data: { status: BookStatus.BORROWED },
      }),
      // Ensure a chat exists between owner and requester for this request
      this.prisma.chat.upsert({
        where: {
          requestId_user1Id_user2Id: {
            requestId,
            user1Id: request.book.ownerId,
            user2Id: request.requesterId,
          },
        },
        update: {},
        create: {
          requestId,
          user1Id: request.book.ownerId,
          user2Id: request.requesterId,
        },
      }),
      // Reject all other pending requests for the same book
      this.prisma.borrowRequest.updateMany({
        where: {
          bookId: request.bookId,
          id: { not: requestId },
          status: BorrowRequestStatus.PENDING,
        },
        data: { status: BorrowRequestStatus.REJECTED },
      }),
    ]);

    // Notify the requester
    try {
      await this.notificationQueue.add(
        'request.accepted',
        { requestId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      console.error('Failed to add to notification queue:', err);
    }

    return {
      ...updatedRequest,
      chatId: chat.id
    };
  }

  async reject(requestId: string, userId: string) {
    const request = await this.findRequestWithBookOwnerCheck(requestId, userId);

    if (request.status !== BorrowRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updatedRequest = await this.prisma.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowRequestStatus.REJECTED },
      include: {
        book: true,
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the requester
    try {
      await this.notificationQueue.add(
        'request.rejected',
        { requestId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      console.error('Failed to add to notification queue:', err);
    }

    return updatedRequest;
  }

  async returnBook(requestId: string, userId: string) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: { book: true },
    });

    if (!request) {
      throw new NotFoundException('Borrow request not found');
    }

    // Either the book owner or the borrower can mark as returned
    if (request.book.ownerId !== userId && request.requesterId !== userId) {
      throw new ForbiddenException('Not authorized to perform this action');
    }

    if (request.status !== BorrowRequestStatus.ACCEPTED) {
      throw new BadRequestException('Only accepted requests can be returned');
    }

    const [updatedRequest] = await this.prisma.$transaction([
      this.prisma.borrowRequest.update({
        where: { id: requestId },
        data: { status: BorrowRequestStatus.RETURNED },
        include: {
          book: true,
          requester: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: request.bookId },
        data: { status: BookStatus.AVAILABLE },
      }),
    ]);

    // Notify the requester that the return was confirmed
    try {
      await this.notificationQueue.add(
        'request.returned',
        { requestId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      console.error('Failed to add to notification queue:', err);
    }

    return updatedRequest;
  }

  async findMyRequests(userId: string) {
    return this.prisma.borrowRequest.findMany({
      where: { requesterId: userId },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReceivedRequests(userId: string) {
    return this.prisma.borrowRequest.findMany({
      where: { book: { ownerId: userId } },
      include: {
        book: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findRequestWithBookOwnerCheck(
    requestId: string,
    userId: string,
  ) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id: requestId },
      include: { book: true },
    });

    if (!request) {
      throw new NotFoundException('Borrow request not found');
    }

    if (request.book.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the book owner can perform this action',
      );
    }

    return request;
  }
}
