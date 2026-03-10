import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('QueueModule');
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);

        logger.log(`BullMQ connecting to Redis at ${host}:${port}`);

        return {
          connection: {
            host,
            port,
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: null,
            retryStrategy: (times: number) => {
              if (times > 3) {
                logger.warn(
                  'BullMQ Redis connection failed. Background jobs will not work.',
                );
                return null;
              }
              return Math.min(times * 200, 2000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    // Register queues for future background tasks
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'email' },
      { name: 'moderation' }
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
