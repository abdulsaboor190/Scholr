import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto';
export declare class BorrowRequestsController {
    private borrowRequestsService;
    constructor(borrowRequestsService: BorrowRequestsService);
    create(userId: string, dto: CreateBorrowRequestDto): Promise<{
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
    accept(id: string, userId: string): Promise<{
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
    reject(id: string, userId: string): Promise<{
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
    returnBook(id: string, userId: string): Promise<{
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
}
