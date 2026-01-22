import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-123456';
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.DATABASE_URL = 'postgres://movegh:movegh@localhost:5432/movegh';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/start (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/start')
      .send({ phone: '+233241234567' })
      .expect(201);

    expect(res.body.requestId).toBeDefined();
    expect(res.body.maskedPhone).toContain('+233');
  });

  it('/auth/start -> /auth/verify -> /users/me', async () => {
    const start = await request(app.getHttpServer())
      .post('/auth/start')
      .send({ phone: '+233241234567' })
      .expect(201);

    const requestId = start.body.requestId as string;
    const authService = app.get(AuthService) as any;
    const store = authService.requests as Map<string, { code: string }>;
    const code = store.get(requestId)?.code;

    const verify = await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ requestId, code })
      .expect(201);

    const token = verify.body.token as string;
    expect(token).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(me.body.phone).toBe('+233241234567');
  });
});
