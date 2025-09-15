import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPaymentAccountService = {
  upsertPaymentAccount: jest.fn(),
};

jest.mock(
  '@/payment-account/application/services/payment-account.service',
  () => ({
    PaymentAccountService: jest
      .fn()
      .mockImplementation(() => mockPaymentAccountService),
  }),
);

describe('MpController E2E', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PaymentAccountService')
      .useValue(mockPaymentAccountService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterAll(async () => {
    await prisma.paymentAccount.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /mp/login', () => {
    it('should return 200 with login URL and codeVerifier when sellerId provided', async () => {
      const sellerId = 'test-seller-123';

      await request(app.getHttpServer())
        .get('/mp/login')
        .query({ sellerId })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.url).toBeDefined();
          expect(res.body.codeVerifier).toBeDefined();
        });
    });

    it('should return 200 with login URL and codeVerifier when no sellerId', async () => {
      await request(app.getHttpServer())
        .get('/mp/login')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.url).toBeDefined();
          expect(res.body.codeVerifier).toBeDefined();
        });
    });

    it('should return different codeVerifier for each request', async () => {
      const sellerId = 'test-seller-456';

      const response1 = await request(app.getHttpServer())
        .get('/mp/login')
        .query({ sellerId })
        .expect(HttpStatus.OK);

      const response2 = await request(app.getHttpServer())
        .get('/mp/login')
        .query({ sellerId })
        .expect(HttpStatus.OK);

      expect(response1.body.codeVerifier).not.toBe(response2.body.codeVerifier);
    });
  });

  describe('GET /mp/callback', () => {
    beforeEach(() => {
      mockPaymentAccountService.upsertPaymentAccount.mockResolvedValue({});
    });

    it('should return 200 with success message when valid parameters provided', async () => {
      const code = 'test-auth-code-123';
      const userId = 'test-user-123';
      const codeVerifier = 'test-code-verifier-123';
      const state = encodeURIComponent(`${userId}:${codeVerifier}`);

      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read write',
        refresh_token: 'test-refresh-token',
        user_id: 12345,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.data).toBeDefined();
        });

      expect(
        mockPaymentAccountService.upsertPaymentAccount,
      ).toHaveBeenCalledWith({
        userId,
        provider: 'mercadopago',
        mpUserId: mockResponse.user_id,
        accessToken: mockResponse.access_token,
        refreshToken: mockResponse.refresh_token,
        expiresIn: BigInt(mockResponse.expires_in),
      });
    });

    it('should return 500 when state format is invalid', async () => {
      const code = 'test-auth-code-101';
      const invalidState = 'invalid-state-format';

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state: invalidState })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should return 500 when state is missing code verifier', async () => {
      const code = 'test-auth-code-202';
      const state = encodeURIComponent('user-without-verifier');

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should handle MercadoPago API errors gracefully', async () => {
      const code = 'test-auth-code-error';
      const userId = 'test-user-error';
      const codeVerifier = 'test-code-verifier-error';
      const state = encodeURIComponent(`${userId}:${codeVerifier}`);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid authorization code'),
      });

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle invalid token response from MercadoPago', async () => {
      const code = 'test-auth-code-invalid';
      const userId = 'test-user-invalid';
      const codeVerifier = 'test-code-verifier-invalid';
      const state = encodeURIComponent(`${userId}:${codeVerifier}`);

      const invalidResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read write',
        refresh_token: 'test-refresh-token',
        user_id: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('E2E Flow: Login to Callback', () => {
    it('should complete full login to callback flow successfully', async () => {
      const sellerId = 'e2e-test-seller';

      const loginResponse = await request(app.getHttpServer())
        .get('/mp/login')
        .query({ sellerId })
        .expect(HttpStatus.OK);

      const { codeVerifier } = loginResponse.body;
      const code = 'e2e-test-code';
      const state = encodeURIComponent(`${sellerId}:${codeVerifier}`);

      const mockResponse = {
        access_token: 'e2e-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'read write',
        refresh_token: 'e2e-refresh-token',
        user_id: 67890,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.data).toBeDefined();
        });

      expect(
        mockPaymentAccountService.upsertPaymentAccount,
      ).toHaveBeenCalledWith({
        userId: sellerId,
        provider: 'mercadopago',
        mpUserId: mockResponse.user_id,
        accessToken: mockResponse.access_token,
        refreshToken: mockResponse.refresh_token,
        expiresIn: BigInt(mockResponse.expires_in),
      });
    });
  });
});
