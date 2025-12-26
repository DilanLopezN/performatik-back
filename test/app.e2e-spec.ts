import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/api/v1/health/liveness (GET)', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/health/liveness',
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.payload)).toEqual({ status: 'ok' });
    });
  });
});
