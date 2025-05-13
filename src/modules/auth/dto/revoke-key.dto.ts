import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RevokeApiKeyDto {
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', description: 'API Key ID to revoke' })
  @IsNotEmpty()
  @IsUUID()
  apiKeyId: string;
}

export class RegenerateApiKeyDto {
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', description: 'Application ID for which to regenerate key' })
  @IsNotEmpty()
  @IsUUID()
  applicationId: string;
}