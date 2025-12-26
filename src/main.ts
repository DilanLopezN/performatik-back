import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { LoggingInterceptor } from './modules/common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create Fastify adapter with options
  const fastifyAdapter = new FastifyAdapter({
    logger: process.env.NODE_ENV === 'development',
    trustProxy: true,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  const configService = app.get(ConfigService);

  // Register Fastify multipart plugin
  const fastifyInstance = app.getHttpAdapter().getInstance();
  await fastifyInstance.register(multipart as any, {
    limits: {
      fileSize: configService.get<number>('upload.maxFileSize', 10485760),
      files: 10,
    },
  });

  // Global prefix and versioning
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const apiVersion = configService.get<string>('app.apiVersion', 'v1');

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion.replace('v', ''),
  });

  // CORS configuration
  const corsOrigins = configService.get<string>('app.corsOrigins', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS API')
      .setDescription('NestJS + Fastify + Prisma + R2 API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('health', 'Health check endpoints')
      .addTag('upload', 'File upload endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger docs available at /${apiPrefix}/docs`);
  }

  // Start server
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(`📚 Environment: ${configService.get<string>('app.nodeEnv')}`);
}

bootstrap();
