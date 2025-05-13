import { Controller, Post, Body, Get, Query, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiOkResponse } from '@nestjs/swagger'; // Use ApiSecurity for API Key
import { Request } from 'express';

import { AnalyticsService } from './analytics.service';
import { CollectEventDto } from './dto/collect-event.dto';
import { EventSummaryQueryDto } from './dto/event-summary-query.dto';
import { UserStatsQueryDto } from './dto/user-stats-query.dto';
import { ApiKeyAuthGuard } from '../../common/guards/api-key.guard';
import { Application } from '../../database/entities/application.entity'; // For typing req.user
import { Event } from '../../database/entities/event.entity';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('client-api-key') // Matches addApiKey name in main.ts
  @Post('collect')
  @Throttle({ default: { limit: 100, ttl: 60 }}) // Override default: 100 requests per 60 seconds per IP for this endpoint
  @ApiOperation({ summary: 'Submits an analytics event' })
  @ApiResponse({ status: 201, description: 'Event collected successfully.', type: Event })
  @ApiResponse({ status: 400, description: 'Invalid event data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (Invalid or missing API Key).'})
  @ApiResponse({ status: 429, description: 'Too Many Requests (Rate Limit Exceeded).'})
  async collectEvent(@Req() req: Request, @Body() collectEventDto: CollectEventDto): Promise<Event> {
    const application = req.user as Application; // Injected by ApiKeyAuthGuard/ApiKeyStrategy
    this.logger.log(`Collecting event for app: ${application.id}, event: ${collectEventDto.event}`);
    return this.analyticsService.collectEvent(application, collectEventDto);
  }

  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('client-api-key')
  @Get('event-summary')
  @Throttle({ default: { limit: 20, ttl: 60 }}) // 20 requests per 60 seconds per IP
  @ApiOperation({ summary: 'Retrieves analytics summary for a specific event type' })
  @ApiOkResponse({ 
    description: 'Event summary retrieved successfully.',
    schema: { // Define example response directly in Swagger if not creating a DTO
      example: {
        event: "login_form_cta_click",
        count: 3400,
        uniqueUsers: 1200,
        deviceData: {
          mobile: 2200,
          desktop: 1200
        },
        applicationId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 429, description: 'Too Many Requests.'})
  async getEventSummary(@Req() req: Request, @Query() queryDto: EventSummaryQueryDto): Promise<any> {
    const application = req.user as Application;
    this.logger.log(`Workspaceing event summary for app: ${application.id}, event: ${queryDto.event}`);
    return this.analyticsService.getEventSummary(application, queryDto);
  }

  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('client-api-key')
  @Get('user-stats')
  @Throttle({ default: { limit: 30, ttl: 60 }}) // 30 requests per 60 seconds per IP
  @ApiOperation({ summary: 'Returns stats based on unique users' })
  @ApiOkResponse({
    description: 'User statistics retrieved successfully.',
    schema: {
      example: {
        userId: "user789",
        totalEvents: 150,
        applicationId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        deviceDetails: {
          browser: "Chrome",
          os: "Android"
        },
        ipAddress: "192.168.1.1",
        lastSeen: "2024-05-12T10:00:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 404, description: 'User not found.'})
  @ApiResponse({ status: 429, description: 'Too Many Requests.'})
  async getUserStats(@Req() req: Request, @Query() queryDto: UserStatsQueryDto): Promise<any> {
    const application = req.user as Application;
    this.logger.log(`Workspaceing user stats for app: ${application.id}, user: ${queryDto.userId}`);
    return this.analyticsService.getUserStats(application, queryDto);
  }
}