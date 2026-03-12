import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(userId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        reviewerId: string;
        revieweeId: string;
        bookId: string;
        rating: number;
        comment: string | null;
    }>;
    getPending(userId: string): Promise<{
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
    findByUser(userId: string, page?: string, limit?: string): Promise<{
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
}
