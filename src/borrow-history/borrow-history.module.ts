import { Module } from '@nestjs/common';
import { BorrowHistoryService } from './borrow-history.service';
import { BorrowHistoryController } from './borrow-history.controller';

@Module({
  controllers: [BorrowHistoryController],
  providers: [BorrowHistoryService],
})
export class BorrowHistoryModule {}
