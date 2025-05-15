import { Controller, Post, Body, Get, UseGuards, Req, Res, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterAppDto } from './dto/register-app.dto';
import { User } from '../../database/entities/user.entity'; // Assuming User entity from App Owner Auth
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; // For App Owner
import { RevokeApiKeyDto, RegenerateApiKeyDto } from './dto/revoke-key.dto';
import { Application } from '../../database/entities/application.entity';
import { ApiKey } from '../../database/entities/api-key.entity';

@ApiTags('Auth & API Key Management')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- Google OAuth Endpoints for App Owner Onboarding ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login for app owners' })
  @ApiResponse({ status: 200, description: 'Redirects to Google for authentication.' })
  async googleAuth(@Req() req) { /* Passport handles the redirect */ }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback URL' })
  @ApiResponse({ status: 200, description: 'Authentication successful, returns JWT and user info.'})
  @ApiResponse({ status: 401, description: 'Not Authenticated via Google.' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user as User);
    // You might want to redirect to a frontend page with the token
    // For now, just return the token
    res.status(HttpStatus.OK).json(result);
  }

  // --- Application Registration & API Key Management (Requires App Owner JWT) ---
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('app-owner-jwt') // Refers to the name in main.ts addBearerAuth
  @Post('register')
  @ApiOperation({ summary: 'Registers a new website/app and generates an API key' })
  @ApiResponse({ status: 201, description: 'Application registered and API key generated.', type: Application }) // Update response type
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized (App Owner not logged in).'})
  async registerApplication(@Body() registerAppDto: RegisterAppDto, @Req() req: Request): Promise<{ application: Application, apiKey: string }> {
    return this.authService.registerApplication(registerAppDto, req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('app-owner-jwt')
  @Get('application/:appId/api-key') // Changed from /api-key to be specific to an application
  @ApiOperation({ summary: 'Retrieves API key details for a registered app (owned by the authenticated user)' })
  @ApiParam({ name: 'appId', description: 'The ID of the application', type: String })
  @ApiResponse({ status: 200, description: 'API Key details retrieved.', type: [ApiKey] }) // Type is array of partial ApiKey
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 404, description: 'Application not found or not owned by user.'})
  async getApiKeyDetails(@Param('appId') appId: string, @Req() req: Request): Promise<Partial<ApiKey>[]> {
    return this.authService.getApiKeyDetails(appId, req.user as User);
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('app-owner-jwt')
  @Post('application/api-key/regenerate')
  @ApiOperation({ summary: 'Regenerates an API key for a specific application' })
  @ApiBody({ type: RegenerateApiKeyDto })
  @ApiResponse({ status: 200, description: 'API Key regenerated and returned.', type: Application }) // Update response type
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 404, description: 'Application not found or not owned by user.'})
  async regenerateApiKey(@Body() regenerateDto: RegenerateApiKeyDto, @Req() req: Request): Promise<{ application: Application, newApiKey: string }> {
    return this.authService.regenerateApiKey(regenerateDto.applicationId, req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('app-owner-jwt')
  @Post('api-key/revoke') // The prompt had /revoke, changed to be more specific
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revokes an API key to prevent further use' })
  @ApiBody({ type: RevokeApiKeyDto })
  @ApiResponse({ status: 200, description: 'API Key revoked successfully.', type: ApiKey })
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 404, description: 'API Key not found or not owned by user.'})
  async revokeApiKey(@Body() revokeDto: RevokeApiKeyDto, @Req() req: Request): Promise<ApiKey> {
    return this.authService.revokeApiKey(revokeDto.apiKeyId, req.user as User);
  }
}