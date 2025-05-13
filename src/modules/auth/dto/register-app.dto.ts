import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterAppDto {
  @ApiProperty({ example: 'My Awesome Website', description: 'Name of the application/website' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}