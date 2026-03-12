import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        ...dto,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(filters: BookFilterDto) {
    const where: Prisma.BookWhereInput = {};

    if (filters.subject) {
      where.subject = { equals: filters.subject, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { author: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    return this.prisma.book.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async update(id: string, userId: string, dto: UpdateBookDto) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own books');
    }

    return this.prisma.book.update({
      where: { id },
      data: { ...dto },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own books');
    }

    await this.prisma.book.delete({ where: { id } });

    return { message: 'Book deleted successfully' };
  }

  async uploadBookImage(id: string, userId: string, imageUrl: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own books');
    }

    // Set imageUrl to the first image uploaded (primary). Append every image to imageUrls[].
    const updateData: any = {
      imageUrls: { push: imageUrl },
    };
    if (!book.imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    return this.prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
