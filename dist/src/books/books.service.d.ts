import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookFilterDto } from './dto';
export declare class BooksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateBookDto): Promise<{
        owner: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        title: string;
        author: string;
        subject: string;
        status: import("@prisma/client").$Enums.BookStatus;
        imageUrl: string | null;
        isHidden: boolean;
        ownerId: string;
    }>;
    findAll(filters: BookFilterDto): Promise<({
        owner: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        title: string;
        author: string;
        subject: string;
        status: import("@prisma/client").$Enums.BookStatus;
        imageUrl: string | null;
        isHidden: boolean;
        ownerId: string;
    })[]>;
    findOne(id: string): Promise<{
        owner: {
            id: string;
            email: string;
            name: string;
        };
        reviews: ({
            reviewer: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            bookId: string;
            rating: number;
            comment: string | null;
            transactionId: string;
            reviewerId: string;
            revieweeId: string;
        })[];
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        title: string;
        author: string;
        subject: string;
        status: import("@prisma/client").$Enums.BookStatus;
        imageUrl: string | null;
        isHidden: boolean;
        ownerId: string;
    }>;
    update(id: string, userId: string, dto: UpdateBookDto): Promise<{
        owner: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        title: string;
        author: string;
        subject: string;
        status: import("@prisma/client").$Enums.BookStatus;
        imageUrl: string | null;
        isHidden: boolean;
        ownerId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    uploadBookImage(id: string, userId: string, imageUrl: string): Promise<{
        owner: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        title: string;
        author: string;
        subject: string;
        status: import("@prisma/client").$Enums.BookStatus;
        imageUrl: string | null;
        isHidden: boolean;
        ownerId: string;
    }>;
}
