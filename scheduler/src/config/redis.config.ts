import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export interface BullMQRedisConfig {
  connection: RedisOptions;
}

export const redisConfig = (
  configService: ConfigService,
): BullMQRedisConfig => {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      connection: {
        host: parsed.hostname,
        port: parseInt(parsed.port, 10) || 6379,
        password: parsed.password || undefined,
        db: parseInt(parsed.pathname.slice(1), 10) || 0,
      },
    };
  }

  const redisPassword = configService.get<string>('REDIS_PASSWORD');

  return {
    connection: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: redisPassword || undefined,
      db: configService.get<number>('REDIS_DB', 0),
    },
  };
};
