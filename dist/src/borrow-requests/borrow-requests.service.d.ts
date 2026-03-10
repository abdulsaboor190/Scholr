import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowRequestDto } from './dto';
export declare class BorrowRequestsService {
    private prisma;
    private readonly notificationQueue;
    constructor(prisma: PrismaService, notificationQueue: Queue);
    create(requesterId: string, dto: CreateBorrowRequestDto): Promise<{
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    }>;
    accept(requestId: string, userId: string): Promise<{
        chatId: string;
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    }>;
    reject(requestId: string, userId: string): Promise<{
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    }>;
    returnBook(requestId: string, userId: string): Promise<{
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    }>;
    findMyRequests(userId: string): Promise<({
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    })[]>;
    findReceivedRequests(userId: string): Promise<({
        book: {
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
        };
        requester: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BorrowRequestStatus;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
        bookId: string;
        requesterId: string;
    })[]>;
    private findRequestWithBookOwnerCheck;
}
