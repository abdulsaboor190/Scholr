import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueModule } from '../queue/queue.module';
import { ModerationProcessor } from './moderation.processor';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, NotificationsModule, QueueModule, RedisModule],
  controllers: [ReportsController],
  providers: [ReportsService, ModerationProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
