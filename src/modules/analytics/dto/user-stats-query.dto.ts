import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserStatsQueryDto {
  @ApiProperty({ example: 'user789', description: 'The unique identifier for the user' })
  @IsNotEmpty()
  @IsString()
  userId: string; // This refers to `clientUserId`
}