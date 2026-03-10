import { BookStatus } from '@prisma/client';
export declare class CreateBookDto {
    title: string;
    author: string;
    subject: string;
    imageUrl?: string;
}
export declare class UpdateBookDto {
    title?: string;
    author?: string;
    subject?: string;
    status?: BookStatus;
    imageUrl?: string;
}
export declare class BookFilterDto {
    subject?: string;
    status?: BookStatus;
    search?: string;
    ownerId?: string;
}
