import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus } from '@prisma/client';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        dailyActiveUsers: number;
        totalBooksListed: number;
        borrowRequestsSent: number;
        completionRate: number;
        pendingReports: any;
        suspendedUsers: number;
        charts: {
            dailyBorrowRequests: {
                date: string;
                count: number;
            }[];
            dailyRegistrations: {
                date: string;
                count: number;
            }[];
        };
    }>;
    private getDailyBorrowRequests;
    private getDailyRegistrations;
    getUsers(search?: string, status?: AccountStatus, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.Role;
            accountStatus: import("@prisma/client").$Enums.AccountStatus;
            averageRating: import("@prisma/client-runtime-utils").Decimal | null;
            reviewCount: number;
            reportCount: number;
            createdAt: Date;
            _count: {
                books: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserDetails(userId: string): Promise<{
        books: {
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
        }[];
        reviewsReceived: ({
            book: {
                id: string;
                title: string;
            };
            reviewer: {
                id: string;
                name: string;
                avatarUrl: string | null;
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
        email: string;
        googleId: string | null;
        name: string;
        password: string | null;
        avatarUrl: string | null;
        pushToken: string | null;
        role: import("@prisma/client").$Enums.Role;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
        averageRating: import("@prisma/client-runtime-utils").Decimal | null;
        reviewCount: number;
        reportCount: number;
        lastActiveAt: Date | null;
        createdAt: Date;
    }>;
    updateUserStatus(userId: string, status: AccountStatus): Promise<{
        id: string;
        name: string;
        accountStatus: import("@prisma/client").$Enums.AccountStatus;
    }>;
    getBooks(search?: string, status?: string, isHidden?: boolean, page?: number, limit?: number): Promise<{
        items: ({
            owner: {
                id: string;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    toggleBookHidden(bookId: string, isHidden: boolean): Promise<{
        id: string;
        title: string;
        isHidden: boolean;
    }>;
}
