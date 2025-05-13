import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule'; // For potential cron jobs like API key cleanup
import * as redisStore from 'cache-manager-redis-store';

import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module'; // For App Owner management
import { HealthController } from './modules/heatlth/health.controller';

// Import Entities for TypeORM
import { User } from './database/entities/user.entity';
import { Application } from './database/entities/application.entity';
import { ApiKey } from './database/entities/api-key.entity';
import { Event } from './database/entities/event.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [User, Application, ApiKey, Event],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // true for dev, false for prod (use migrations)
        autoLoadEntities: true, // Automatically loads entities registered through forFeature()
        logging: configService.get<string>('NODE_ENV') !== 'production' ? 'all' : ['error'],
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        ttl: 60, // default TTL in seconds
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      ttl: 60, // seconds
      limit: 100, // requests per ttl
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    AnalyticsModule,
    UsersModule,
  ],
  controllers: [HealthController], // Basic health check
})
export class AppModule {}