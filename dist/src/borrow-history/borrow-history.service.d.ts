import { PrismaService } from '../prisma/prisma.service';
export declare class BorrowHistoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getBorrowerHistory(userId: string): Promise<({
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
    getLenderHistory(userId: string): Promise<({
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
    })[]>;
}
