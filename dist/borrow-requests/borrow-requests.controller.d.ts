import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto';
export declare class BorrowRequestsController {
    private borrowRequestsService;
    constructor(borrowRequestsService: BorrowRequestsService);
    create(userId: string, dto: CreateBorrowRequestDto): Promise<{
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
    accept(id: string, userId: string): Promise<{
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
    reject(id: string, userId: string): Promise<{
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
    returnBook(id: string, userId: string): Promise<{
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
}
