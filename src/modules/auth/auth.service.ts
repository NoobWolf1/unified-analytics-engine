import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { addDays } from 'date-fns';

import { Application } from '../../database/entities/application.entity';
import { ApiKey } from '../../database/entities/api-key.entity';
import { User } from '../../database/entities/user.entity';
import { hashString, generateApiKey, compareStringAndHash } from '../../shared/utils/hash.utils';
import { RegisterAppDto } from './dto/register-app.dto';
import { Cron, CronExpression } from '@nestjs/schedule'; // For scheduled tasks

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // --- Google OAuth Related ---
  async googleLogin(reqUser: User) {
    if (!reqUser) {
      throw new BadRequestException('No user from Google');
    }
    // User is already created/updated by GoogleStrategy
    // Now, generate a JWT for our app owner session
    const payload = { sub: reqUser.id, email: reqUser.email };
    return {
      message: 'User information from Google processed.',
      user: { id: reqUser.id, email: reqUser.email, name: reqUser.name },
      accessToken: this.jwtService.sign(payload),
    };
  }

  // --- Application & API Key Management ---
  async registerApplication(registerAppDto: RegisterAppDto, owner: User): Promise<{ application: Application; apiKey: string }> {
    const application = this.applicationsRepository.create({
      name: registerAppDto.name,
      owner: owner,
      ownerId: owner.id,
    });
    await this.applicationsRepository.save(application);

    const { plainKey, apiKeyEntity } = await this._generateAndSaveApiKey(application);
    
    return { application, apiKey: plainKey }; // Return plain key ONCE
  }

  private async _generateAndSaveApiKey(application: Application): Promise<{ plainKey: string, apiKeyEntity: ApiKey }> {
    const plainKey = generateApiKey();
    const keyHash = await hashString(plainKey);
    const keyPrefix = plainKey.substring(0, 6); // For easier identification if needed
    const expirationDays = this.configService.get<number>('apiKey.defaultExpirationDays');
    const expiresAt = addDays(new Date(), expirationDays ?? 30); // Default to 30 days if undefined

    const apiKeyEntity = this.apiKeysRepository.create({
      keyHash,
      keyPrefix,
      application,
      applicationId: application.id,
      expiresAt,
    });
    await this.apiKeysRepository.save(apiKeyEntity);
    return { plainKey, apiKeyEntity };
  }

  async getApiKeyDetails(applicationId: string, owner: User): Promise<Partial<ApiKey>[]> {
    const application = await this.applicationsRepository.findOne({ where: { id: applicationId, ownerId: owner.id } });
    if (!application) {
      throw new NotFoundException('Application not found or access denied.');
    }
    // Return metadata, not the key itself.
    const keys = await this.apiKeysRepository.find({
      where: { applicationId: application.id },
      select: ['id', 'keyPrefix', 'createdAt', 'expiresAt', 'revokedAt', 'lastUsedAt'],
      order: { createdAt: 'DESC' }
    });
    return keys;
  }

  async regenerateApiKey(applicationId: string, owner: User): Promise<{ application: Application; newApiKey: string }> {
    const application = await this.applicationsRepository.findOne({ where: { id: applicationId, ownerId: owner.id }, relations: ['apiKeys'] });
    if (!application) {
      throw new NotFoundException('Application not found or access denied.');
    }

    // Optionally revoke all old keys for this application
    if (application.apiKeys && application.apiKeys.length > 0) {
      const oldKeyIds = application.apiKeys.filter(k => !k.revokedAt).map(k => k.id);
      if (oldKeyIds.length > 0) {
        await this.apiKeysRepository.update(oldKeyIds, { revokedAt: new Date() });
        this.logger.log(`Revoked ${oldKeyIds.length} old API keys for application ${applicationId}`);
      }
    }
    
    const { plainKey, apiKeyEntity } = await this._generateAndSaveApiKey(application);
    return { application, newApiKey: plainKey }; // Return new plain key ONCE
  }

  async revokeApiKey(apiKeyId: string, owner: User): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { id: apiKeyId },
      relations: ['application'],
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found.');
    }
    if (apiKey.application.ownerId !== owner.id) {
      throw new UnauthorizedException('You do not own this API Key.');
    }
    if (apiKey.revokedAt) {
        throw new BadRequestException('API Key already revoked.');
    }

    apiKey.revokedAt = new Date();
    return this.apiKeysRepository.save(apiKey);
  }

  async validateApiKey(key: string): Promise<Application | null> {
    // This method is primarily for the ApiKeyStrategy/Guard
    // For performance, we might want to cache API key validation results briefly.
    // However, revocation needs to be immediate, so cache TTL must be very short or non-existent for this specific check.

    const keys = await this.apiKeysRepository.find({
        relations: ['application'], // Ensure application is loaded
        // No direct way to query by plain key, so we have to iterate if multiple keys could match prefix
        // A more complex approach would be to query by prefix then compare hashes, but that's rarely needed.
        // The most common case is that the full key hash is known or the key is directly provided.
    });

    for (const apiKeyEntity of keys) {
        if (await compareStringAndHash(key, apiKeyEntity.keyHash)) {
            if (apiKeyEntity.revokedAt) {
              this.logger.warn(`Attempt to use revoked API key ID: ${apiKeyEntity.id}`);
              return null; // Key is revoked
            }
            if (new Date(apiKeyEntity.expiresAt) < new Date()) {
              this.logger.warn(`Attempt to use expired API key ID: ${apiKeyEntity.id}`);
              return null; // Key is expired
            }
            
            // Update lastUsedAt (fire and forget, not critical path)
            this.apiKeysRepository.update(apiKeyEntity.id, { lastUsedAt: new Date() }).catch(err => {
                this.logger.error(`Failed to update lastUsedAt for API key ${apiKeyEntity.id}`, err.stack);
            });
            
            if (!apiKeyEntity.application) {
                this.logger.error(`API key ${apiKeyEntity.id} has no associated application.`);
                throw new InternalServerErrorException('API key configuration error.');
            }
            return apiKeyEntity.application;
        }
    }
    return null; // Key not found or hash mismatch
  }

  // Scheduled task to clean up expired (but not necessarily revoked) keys, or other maintenance
  @Cron('0 0 * * *')
  async handleCron() {
    this.logger.log('Running scheduled tasks for API keys...');
    // Example: Find keys expired more than 30 days ago and hard delete them if desired
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // const oldExpiredKeys = await this.apiKeysRepository.find({
    //   where: { expiresAt: LessThan(thirtyDaysAgo) }
    // });
    // if (oldExpiredKeys.length > 0) {
    //   // this.apiKeysRepository.remove(oldExpiredKeys);
    //   this.logger.log(`Cleaned up ${oldExpiredKeys.length} very old expired API keys.`);
    // }
  }
}