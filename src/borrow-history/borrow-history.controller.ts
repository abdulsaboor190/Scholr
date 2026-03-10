import { Controller, Get } from '@nestjs/common';
import { BorrowHistoryService } from './borrow-history.service';
import { CurrentUser } from '../common/decorators';

@Controller('borrow-history')
export class BorrowHistoryController {
  constructor(private borrowHistoryService: BorrowHistoryService) {}

  @Get('borrower')
  getBorrowerHistory(@CurrentUser('id') userId: string) {
    return this.borrowHistoryService.getBorrowerHistory(userId);
  }

  @Get('lender')
  getLenderHistory(@CurrentUser('id') userId: string) {
    return this.borrowHistoryService.getLenderHistory(userId);
  }
}
