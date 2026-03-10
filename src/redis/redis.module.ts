import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          maxRetriesPerRequest: null,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.warn(
                'Redis connection failed after 3 attempts. Running without Redis — refresh tokens will not persist.',
              );
              return null; // Stop retrying
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        redis.on('error', (err: any) => {
          if (err.code !== 'ECONNREFUSED') {
            logger.error('Redis error:', err.message);
          }
        });

        // Attempt connection but don't block startup
        redis.connect().catch(() => {
          logger.warn(
            'Redis not available. Refresh tokens and queues will not work.',
          );
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
