import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChatDto {
  @IsUUID()
  requestId: string;

  @IsString()
  @MinLength(1)
  message: string;
}
