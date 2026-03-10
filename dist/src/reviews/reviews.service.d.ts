import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(reviewerId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        bookId: string;
        rating: number;
        comment: string | null;
        transactionId: string;
        reviewerId: string;
        revieweeId: string;
    }>;
    findByUser(targetUserId: string, page?: number, limit?: number): Promise<{
        items: ({
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
        total: number;
        page: number;
        limit: number;
    }>;
    getPendingForUser(userId: string): Promise<{
        id: string;
        transactionId: string;
        book: {
            id: string;
            title: string;
            imageUrl: string | null;
        };
        otherParty: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }[]>;
    private recalculateUserRating;
}
