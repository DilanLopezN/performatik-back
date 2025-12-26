import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // R2 Storage
  R2_ACCOUNT_ID: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_URL: Joi.string().optional(),

  // Upload
  MAX_FILE_SIZE: Joi.number().default(10485760),
  ALLOWED_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/gif,image/webp,application/pdf',
  ),

  // CORS
  CORS_ORIGINS: Joi.string().default('*'),

  // Throttle
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
});
