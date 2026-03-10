import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto';
import { CurrentUser } from '../common/decorators';

@Controller('borrow-requests')
export class BorrowRequestsController {
  constructor(private borrowRequestsService: BorrowRequestsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBorrowRequestDto,
  ) {
    return this.borrowRequestsService.create(userId, dto);
  }

  @Patch(':id/accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.borrowRequestsService.accept(id, userId);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.borrowRequestsService.reject(id, userId);
  }

  @Patch(':id/return')
  returnBook(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.borrowRequestsService.returnBook(id, userId);
  }

  @Get('my-requests')
  findMyRequests(@CurrentUser('id') userId: string) {
    return this.borrowRequestsService.findMyRequests(userId);
  }

  @Get('received')
  findReceivedRequests(@CurrentUser('id') userId: string) {
    return this.borrowRequestsService.findReceivedRequests(userId);
  }
}
