import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Event } from '../../database/entities/event.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for ApiKeyStrategy/Guard

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    AuthModule, // Provides PassportModule and strategies used by guards
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}