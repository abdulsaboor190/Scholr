import { IsString, IsUUID } from 'class-validator';

export class CreateBorrowRequestDto {
  @IsUUID()
  bookId: string;
}
