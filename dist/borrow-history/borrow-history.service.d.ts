import { PrismaService } from '../prisma/prisma.service';
export declare class BorrowHistoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getBorrowerHistory(userId: string): Promise<({
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
            imageUrls: string[];
            isHidden: boolean;
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
    getLenderHistory(userId: string): Promise<({
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
            imageUrls: string[];
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
}
