import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const logger = new Logger('Bootstrap');

  app.enableCors(); // Configure allowed origins for production
  app.use(helmet()); // Basic security headers

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  // Swagger (OpenAPI) Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Unified Event Analytics Engine API')
    .setDescription('API documentation for the Unified Event Analytics Engine')
    .setVersion('1.0')
    .addBearerAuth( // For App Owner JWTs
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'app-owner-jwt',
    )
    .addApiKey( // For Client App API Keys
      { type: 'apiKey', name: 'X-API-KEY', in: 'header' },
      'client-api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();