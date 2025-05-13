import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { GoogleStrategy } from './strategies/google.strategy'; // For Google OAuth
import { JwtStrategy } from './strategies/jwt.strategy'; // For app owner session
import { Application } from '../../database/entities/application.entity';
import { ApiKey } from '../../database/entities/api-key.entity';
import { ApiKeyStrategy } from './strategies/api-key.strategy'; // For client app auth

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    TypeOrmModule.forFeature([Application, ApiKey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expirationTime') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy, ApiKeyStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule], // Export PassportModule for guards
})
export class AuthModule {}