import { Injectable, Logger, Inject, CACHE_MANAGER, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from 'typeorm';
import { Cache } from 'cache-manager';

import { Event } from '../../database/entities/event.entity';
import { Application } from '../../database/entities/application.entity';
import { CollectEventDto } from './dto/collect-event.dto';
import { EventSummaryQueryDto } from './dto/event-summary-query.dto';
import { UserStatsQueryDto } from './dto/user-stats-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async collectEvent(application: Application, collectEventDto: CollectEventDto): Promise<Event> {
    const event = this.eventsRepository.create({
      ...collectEventDto,
      applicationId: application.id,
      timestamp: new Date(collectEventDto.timestamp), // Ensure it's a Date object
      // ipAddress could be enriched on server-side if not provided by client
    });

    try {
      const savedEvent = await this.eventsRepository.save(event);
      // Invalidate relevant caches here if needed, though for high-volume ingestion,
      // TTL-based caching on read endpoints is more common.
      // e.g. this.cacheManager.del(`event-summary:${application.id}:${event.eventName}*`);
      return savedEvent;
    } catch (error) {
      this.logger.error(`Failed to save event for app ${application.id}: ${error.message}`, error.stack);
      throw error; // Re-throw to be caught by NestJS exception filter
    }
  }

  async getEventSummary(
    applicationFromApiKey: Application,
    query: EventSummaryQueryDto,
  ): Promise<any> { // Define a proper response DTO later
    
    // Determine actual application ID to use.
    // If query.app_id is provided AND matches the app_id from API key, use it.
    // Otherwise, always use app_id from API key.
    // This handles the case where an API key is strictly tied to one app.
    // The "fetch across all apps" scenario is more complex and needs App Owner Auth.
    let targetApplicationId = applicationFromApiKey.id;

    if (query.app_id && query.app_id !== applicationFromApiKey.id) {
        // This scenario should ideally be disallowed or handled by a higher privilege (owner)
        this.logger.warn(`Query app_id ${query.app_id} differs from API key's app_id ${applicationFromApiKey.id}. Using API key's app_id.`);
        // For security, we stick to the API key's application ID.
    }
    
    const cacheKey = `event-summary:${targetApplicationId}:${query.event}:${query.startDate || 'all'}:${query.endDate || 'all'}`;
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cachedData;
    }
    this.logger.log(`Cache MISS for key: ${cacheKey}`);

    const conditions: FindOptionsWhere<Event> = {
      applicationId: targetApplicationId,
      eventName: query.event,
    };

    if (query.startDate && query.endDate) {
      conditions.timestamp = Between(new Date(query.startDate), new Date(query.endDate + 'T23:59:59.999Z'));
    } else if (query.startDate) {
      conditions.timestamp = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      conditions.timestamp = LessThanOrEqual(new Date(query.endDate + 'T23:59:59.999Z'));
    }
    
    const qb = this.eventsRepository.createQueryBuilder('event')
      .where('event.applicationId = :applicationId', { applicationId: targetApplicationId })
      .andWhere('event.eventName = :eventName', { eventName: query.event });

    if (query.startDate) {
      qb.andWhere('event.timestamp >= :startDate', { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      // Ensure endDate includes the whole day
      const endOfDay = new Date(query.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      qb.andWhere('event.timestamp <= :endDate', { endDate: endOfDay });
    }
    
    const totalCount = await qb.getCount();
    
    const uniqueUsersResult = await qb
      .select('COUNT(DISTINCT event.clientUserId)', 'uniqueCount')
      .getRawOne();
    const uniqueUsers = uniqueUsersResult ? parseInt(uniqueUsersResult.uniqueCount, 10) : 0;

    const deviceDataResult = await qb
      .select('event.deviceType as deviceType, COUNT(*) as count')
      .groupBy('event.deviceType')
      .getRawMany();

    const deviceData = deviceDataResult.reduce((acc, item) => {
      acc[item.deviceType] = parseInt(item.count, 10);
      return acc;
    }, {});

    const summary = {
      event: query.event,
      count: totalCount,
      uniqueUsers: uniqueUsers,
      deviceData: deviceData,
      applicationId: targetApplicationId, // For clarity in response
    };

    await this.cacheManager.set(cacheKey, summary, 300); // Cache for 5 minutes
    return summary;
  }

  async getUserStats(
    applicationFromApiKey: Application,
    query: UserStatsQueryDto,
  ): Promise<any> { // Define a proper response DTO later
    const targetApplicationId = applicationFromApiKey.id;

    const cacheKey = `user-stats:${targetApplicationId}:${query.userId}`;
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache HIT for key: ${cacheKey}`);
      return cachedData;
    }
    this.logger.log(`Cache MISS for key: ${cacheKey}`);

    const events = await this.eventsRepository.find({
      where: {
        applicationId: targetApplicationId,
        clientUserId: query.userId,
      },
      order: { timestamp: 'DESC' }, // Get recent events first
    });

    if (events.length === 0) {
      throw new NotFoundException(`No data found for user ${query.userId} in application ${targetApplicationId}`);
    }

    const totalEvents = events.length;
    const latestEvent = events[0]; // Most recent one

    const userStats = {
      userId: query.userId,
      totalEvents,
      applicationId: targetApplicationId,
      deviceDetails: latestEvent.metadata ? { // From the latest event
        browser: latestEvent.metadata.browser,
        os: latestEvent.metadata.os,
        screenSize: latestEvent.metadata.screenSize,
      } : {},
      ipAddress: latestEvent.ipAddress, // From the latest event
      lastSeen: latestEvent.timestamp,
    };

    await this.cacheManager.set(cacheKey, userStats,  300); // Cache for 5 minutes
    return userStats;
  }
}