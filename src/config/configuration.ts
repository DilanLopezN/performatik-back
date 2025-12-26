export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    apiVersion: process.env.API_VERSION || 'v1',
    corsOrigins: process.env.CORS_ORIGINS || '*',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  },

  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/gif,image/webp,application/pdf'
    ).split(','),
  },

  throttle: {
    ttl: Number(process.env.THROTTLE_TTL) || 60,
    limit: Number(process.env.THROTTLE_LIMIT) || 100,
  },
});
