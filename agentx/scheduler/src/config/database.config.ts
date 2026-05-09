import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
      logging: configService.get<string>('DB_LOGGING') === 'true',
      ssl: configService.get<string>('DB_SSL') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_DATABASE', 'agentx'),
    autoLoadEntities: true,
    synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
    logging: configService.get<string>('DB_LOGGING') === 'true',
  };
};
