import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BorrowRequestsService } from './borrow-requests.service';
import { BorrowRequestsController } from './borrow-requests.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  controllers: [BorrowRequestsController],
  providers: [BorrowRequestsService],
  exports: [BorrowRequestsService],
})
export class BorrowRequestsModule {}
