import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { AuthModule } from './modules/auth';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Database
    PrismaModule,

    //Auth
    AuthModule,

    // Feature modules
    HealthModule,
    UploadModule,
  ],
})
export class AppModule {}
