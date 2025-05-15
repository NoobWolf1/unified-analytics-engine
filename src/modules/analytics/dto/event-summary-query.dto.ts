import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsUUID, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class EventSummaryQueryDto {
  @ApiPropertyOptional({ example: 'login_form_cta_click', description: 'Specific event name to filter by' })
  @IsNotEmpty() // Event name is required for summary
  @IsString()
  event: string;

  @ApiPropertyOptional({ example: '2024-02-15', description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-02-20', description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
  
  // Note: app_id is implicitly handled by the API Key. 
  // If an admin/owner needs to query across apps, that's a different auth context (JWT)
  // and the controller would need to handle that logic.
  // For API-key authenticated endpoints, app_id from query param would be redundant or an override,
  // which could be a security risk if not handled carefully.
  // For now, we'll rely on the API key defining the app_id.
  // The prompt mentioned "if this property is not there in request payload fetch data across all the apps created by app owner"
  // This part requires owner-level authentication (JWT), not client API key.
  // We will implement the API-key scoped version first.
  @ApiPropertyOptional({ example: 'xyz123', description: 'Application ID to filter by (optional, usually derived from API Key)'})
  @IsOptional()
  @IsUUID()
  app_id?: string; 
}