import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Strategy } from 'passport-custom'; // Using passport-custom for header check
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { Application } from '../../../database/entities/application.entity';


@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'client-api-key') {
  private readonly logger = new Logger(ApiKeyStrategy.name);

  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<Application> { // Return Application object on success
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      this.logger.warn('Attempt to access protected route without API key.');
      throw new UnauthorizedException('API Key is missing.');
    }

    const application = await this.authService.validateApiKey(apiKey);
    if (!application) {
      this.logger.warn(`Invalid or expired API key provided: ${apiKey.substring(0,10)}...`);
      throw new UnauthorizedException('Invalid or expired API Key.');
    }
    
    // Attach the application to the request object for use in controllers/services
    // The Passport infrastructure does this automatically when `validate` returns.
    // The returned 'application' will be available as req.user by default.
    return application;
  }
}