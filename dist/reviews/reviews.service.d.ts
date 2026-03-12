import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(reviewerId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        reviewerId: string;
        revieweeId: string;
        bookId: string;
        rating: number;
        comment: string | null;
    }>;
    findByUser(targetUserId: string, page?: number, limit?: number): Promise<{
        items: ({
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
        total: number;
        page: number;
        limit: number;
    }>;
    findByBook(bookId: string): Promise<({
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
    })[]>;
    getPendingForUser(userId: string): Promise<{
        id: string;
        transactionId: string;
        book: {
            id: string;
            title: string;
            imageUrl: string | null;
        };
        otherParty: {
            name: string;
            id: string;
            avatarUrl: string | null;
        };
    }[]>;
    private recalculateUserRating;
}
