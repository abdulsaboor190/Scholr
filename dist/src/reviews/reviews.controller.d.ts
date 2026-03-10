import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(userId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        bookId: string;
        rating: number;
        comment: string | null;
        transactionId: string;
        reviewerId: string;
        revieweeId: string;
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
            id: string;
            name: string;
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
}
