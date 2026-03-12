import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, BookFilterDto } from './dto';
export declare class BooksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateBookDto): Promise<{
        owner: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        subject: string;
        title: string;
        author: string;
        imageUrl: string | null;
        status: import(".prisma/client").$Enums.BookStatus;
        ownerId: string;
        imageUrls: string[];
        isHidden: boolean;
    }>;
    findAll(filters: BookFilterDto): Promise<({
        owner: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        subject: string;
        title: string;
        author: string;
        imageUrl: string | null;
        status: import(".prisma/client").$Enums.BookStatus;
        ownerId: string;
        imageUrls: string[];
        isHidden: boolean;
    })[]>;
    findOne(id: string): Promise<{
        owner: {
            name: string;
            email: string;
            id: string;
        };
        reviews: ({
            reviewer: {
                name: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            transactionId: string;
            reviewerId: string;
            revieweeId: string;
            bookId: string;
            rating: number;
            comment: string | null;
        })[];
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        subject: string;
        title: string;
        author: string;
        imageUrl: string | null;
        status: import(".prisma/client").$Enums.BookStatus;
        ownerId: string;
        imageUrls: string[];
        isHidden: boolean;
    }>;
    update(id: string, userId: string, dto: UpdateBookDto): Promise<{
        owner: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        subject: string;
        title: string;
        author: string;
        imageUrl: string | null;
        status: import(".prisma/client").$Enums.BookStatus;
        ownerId: string;
        imageUrls: string[];
        isHidden: boolean;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    uploadBookImage(id: string, userId: string, imageUrl: string): Promise<{
        owner: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        reportCount: number;
        createdAt: Date;
        subject: string;
        title: string;
        author: string;
        imageUrl: string | null;
        status: import(".prisma/client").$Enums.BookStatus;
        ownerId: string;
        imageUrls: string[];
        isHidden: boolean;
    }>;
}
