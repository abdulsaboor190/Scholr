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
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    }>;
    accept(requestId: string, userId: string): Promise<{
        chatId: string;
        book: {
            id: string;
            reportCount: number;
            createdAt: Date;
            subject: string;
            title: string;
            author: string;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.BookStatus;
            ownerId: string;
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    }>;
    reject(requestId: string, userId: string): Promise<{
        book: {
            id: string;
            reportCount: number;
            createdAt: Date;
            subject: string;
            title: string;
            author: string;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.BookStatus;
            ownerId: string;
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    }>;
    returnBook(requestId: string, userId: string): Promise<{
        book: {
            id: string;
            reportCount: number;
            createdAt: Date;
            subject: string;
            title: string;
            author: string;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.BookStatus;
            ownerId: string;
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    }>;
    findMyRequests(userId: string): Promise<({
        book: {
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
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    })[]>;
    findReceivedRequests(userId: string): Promise<({
        book: {
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
            isHidden: boolean;
        };
        requester: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.BorrowRequestStatus;
        bookId: string;
        requesterId: string;
        dueDate: Date | null;
        lastNotifiedAt: Date | null;
        updatedAt: Date;
    })[]>;
    private findRequestWithBookOwnerCheck;
}
