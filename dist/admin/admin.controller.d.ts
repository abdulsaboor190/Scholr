import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { AccountStatus } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    private readonly authService;
    constructor(adminService: AdminService, authService: AuthService);
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
    getUsers(search?: string, status?: AccountStatus, page?: string, limit?: string): Promise<{
        items: {
            name: string;
            email: string;
            id: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            accountStatus: import(".prisma/client").$Enums.AccountStatus;
            averageRating: import("@prisma/client/runtime/library").Decimal | null;
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
            subject: string;
            title: string;
            author: string;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.BookStatus;
            ownerId: string;
            isHidden: boolean;
        }[];
        reviewsReceived: ({
            book: {
                id: string;
                title: string;
            };
            reviewer: {
                name: string;
                id: string;
                avatarUrl: string | null;
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
        name: string;
        email: string;
        password: string | null;
        id: string;
        googleId: string | null;
        avatarUrl: string | null;
        pushToken: string | null;
        role: import(".prisma/client").$Enums.Role;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        averageRating: import("@prisma/client/runtime/library").Decimal | null;
        reviewCount: number;
        reportCount: number;
        lastActiveAt: Date | null;
        createdAt: Date;
    }>;
    updateUserStatus(userId: string, status: AccountStatus): Promise<{
        name: string;
        id: string;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
    }>;
    getBooks(search?: string, status?: string, isHidden?: string, page?: string, limit?: string): Promise<{
        items: ({
            owner: {
                name: string;
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
