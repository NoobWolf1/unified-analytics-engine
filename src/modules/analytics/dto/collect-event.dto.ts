import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, IsIP, IsDateString, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class EventMetadataDto {
  @ApiPropertyOptional({ example: 'Chrome', description: 'Browser name' })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional({ example: 'Android', description: 'Operating System' })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiPropertyOptional({ example: '1080x1920', description: 'Screen resolution' })
  @IsOptional()
  @IsString()
  screenSize?: string;

  // Allow any other custom metadata
  [key: string]: any;
}

export class CollectEventDto {
  @ApiProperty({ example: 'login_form_cta_click', description: 'Name of the event' })
  @IsNotEmpty()
  @IsString()
  @Type(() => String) // Ensure transformation if needed
  event: string;

  @ApiPropertyOptional({ example: 'https://example.com/page', description: 'URL where event occurred' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 'https://google.com', description: 'Referrer URL' })
  @IsOptional()
  @IsUrl({}, { message: 'Referrer must be a valid URL or null/undefined' })
  referrer?: string;

  @ApiProperty({ example: 'mobile', description: 'Device type (mobile, desktop, tablet)' })
  @IsNotEmpty()
  @IsString()
  device: string;

  @ApiPropertyOptional({ example: 'user_123_abc', description: 'Client-side unique user identifier' })
  @IsOptional()
  @IsString()
  clientUserId?: string; // Added this for user-based analytics

  @ApiPropertyOptional({ example: '192.168.1.100', description: 'IP address of the client' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiProperty({ example: '2024-02-20T12:34:56Z', description: 'Timestamp of the event in ISO 8601 format' })
  @IsNotEmpty()
  @IsDateString()
  timestamp: string; // Will be converted to Date object

  @ApiPropertyOptional({ description: 'Additional metadata', type: EventMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventMetadataDto)
  @IsObject()
  metadata?: EventMetadataDto;
}