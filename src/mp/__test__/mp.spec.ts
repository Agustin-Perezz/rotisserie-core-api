import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { AppModule } from '../../app.module';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPaymentAccountService = {
  upsertPaymentAccount: jest.fn(),
  findByUserIdAndProvider: jest.fn(),
};

const mockOrderService = {
  findById: jest.fn(),
};

const mockPreferenceCreate = jest.fn();
const mockPaymentCreate = jest.fn();

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn().mockImplementation(() => ({
    create: mockPreferenceCreate,
  })),
  Payment: jest.fn().mockImplementation(() => ({
    create: mockPaymentCreate,
  })),
}));

jest.mock(
  '@/payment-account/application/services/payment-account.service',
  () => ({
    PaymentAccountService: jest
      .fn()
      .mockImplementation(() => mockPaymentAccountService),
  }),
);

jest.mock('@/order/application/services/order.service', () => ({
  OrderService: jest.fn().mockImplementation(() => mockOrderService),
}));

const mockMapOrderItemsToMpItems = jest.fn();

jest.mock('@mp/application/mappers/order-to-mp-items.mapper', () => ({
  OrderToMpItemsMapper: {
    mapOrderItemsToMpItems: mockMapOrderItemsToMpItems,
  },
}));

describe('MpController E2E', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PaymentAccountService')
      .useValue(mockPaymentAccountService)
      .overrideProvider('OrderService')
      .useValue(mockOrderService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPreferenceCreate.mockClear();
    mockPaymentCreate.mockClear();
    mockOrderService.findById.mockClear();
    mockMapOrderItemsToMpItems.mockClear();
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

    it('should return 404 when state format is invalid', async () => {
      const code = 'test-auth-code-101';
      const invalidState = 'invalid-state-format';

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state: invalidState })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 when state is missing code verifier', async () => {
      const code = 'test-auth-code-202';
      const state = encodeURIComponent('user-without-verifier');

      await request(app.getHttpServer())
        .get('/mp/callback')
        .query({ code, state })
        .expect(HttpStatus.BAD_REQUEST);
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

  describe('POST /mp/preference', () => {
    beforeEach(() => {
      mockPaymentAccountService.findByUserIdAndProvider.mockResolvedValue({
        accessToken: 'mock-access-token',
        userId: 'test-owner-123',
        provider: 'mercadopago',
      });

      const mockOrder = {
        id: 'order-123',
        shopId: 'shop-123',
        orderItems: [
          {
            item: {
              id: 'item-1',
              name: 'Test Product',
              price: 100.5,
              description: 'Test product description',
              image: 'test-image.jpg',
            },
            quantity: 1,
          },
        ],
      };

      mockOrderService.findById.mockResolvedValue(mockOrder);
      mockMapOrderItemsToMpItems.mockReturnValue([
        {
          id: 'item-1',
          title: 'Test Product',
          quantity: 1,
          unit_price: 100.5,
        },
      ]);
    });

    it('should create preference successfully with valid data', async () => {
      const preferenceData = {
        ownerId: 'test-owner-123',
        orderId: 'order-123',
        purpose: 'wallet_purchase',
        back_urls: {
          success: 'https://example.com/success',
          failure: 'https://example.com/failure',
          pending: 'https://example.com/pending',
        },
        external_reference: 'ref-123',
        metadata: { custom_data: 'test' },
      };

      const mockPreferenceResponse = {
        id: 'preference-id-123',
      };

      mockPreferenceCreate.mockResolvedValueOnce(mockPreferenceResponse);

      await request(app.getHttpServer())
        .post('/mp/preference')
        .send(preferenceData)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.preferenceId).toBe('preference-id-123');
        });

      expect(mockOrderService.findById).toHaveBeenCalledWith('order-123');
      expect(mockMapOrderItemsToMpItems).toHaveBeenCalled();
      expect(
        mockPaymentAccountService.findByUserIdAndProvider,
      ).toHaveBeenCalledWith('test-owner-123', 'mercadopago');
      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: {
          purpose: 'wallet_purchase',
          items: [
            {
              id: 'item-1',
              title: 'Test Product',
              quantity: 1,
              unit_price: 100.5,
            },
          ],
          back_urls: {
            success: 'https://example.com/success',
            failure: 'https://example.com/failure',
            pending: 'https://example.com/pending',
          },
          external_reference: 'ref-123',
          metadata: {
            custom_data: 'test',
            orderId: 'order-123',
            shopId: 'shop-123',
          },
          binary_mode: true,
        },
      });
    });

    it('should return 400 when owner has no payment account', async () => {
      mockPaymentAccountService.findByUserIdAndProvider.mockResolvedValue(null);

      const preferenceData = {
        ownerId: 'no-account-owner',
        orderId: 'order-123',
      };

      await request(app.getHttpServer())
        .post('/mp/preference')
        .send(preferenceData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when MercadoPago API fails', async () => {
      const preferenceData = {
        ownerId: 'test-owner-error',
        orderId: 'order-error',
      };

      mockPreferenceCreate.mockRejectedValueOnce(
        new Error('MercadoPago API Error'),
      );

      await request(app.getHttpServer())
        .post('/mp/preference')
        .send(preferenceData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create preference with minimal required data', async () => {
      const minimalData = {
        ownerId: 'test-owner-minimal',
        orderId: 'order-minimal',
      };

      const mockResponse = { id: 'minimal-preference-id' };
      mockPreferenceCreate.mockResolvedValueOnce(mockResponse);

      await request(app.getHttpServer())
        .post('/mp/preference')
        .send(minimalData)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.preferenceId).toBe('minimal-preference-id');
        });

      expect(mockOrderService.findById).toHaveBeenCalledWith('order-minimal');
      expect(mockMapOrderItemsToMpItems).toHaveBeenCalled();
    });
  });

  describe('POST /mp/process_payment', () => {
    beforeEach(() => {
      mockPaymentAccountService.findByUserIdAndProvider.mockResolvedValue({
        accessToken: 'mock-access-token',
        userId: 'test-owner-123',
        provider: 'mercadopago',
      });
    });

    it('should process payment successfully with valid data', async () => {
      const paymentData = {
        ownerId: 'test-owner-123',
        formData: {
          transaction_amount: 150.75,
          token: 'card-token-123',
          installments: 1,
          payment_method_id: 'visa',
          issuer_id: '303',
          payer: {
            email: 'test@example.com',
            first_name: 'John',
            identification: {
              type: 'DNI',
              number: '12345678',
            },
          },
        },
      };

      const mockPaymentResponse = {
        id: 'payment-id-123',
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 150.75,
      };

      mockPaymentCreate.mockResolvedValueOnce(mockPaymentResponse);

      await request(app.getHttpServer())
        .post('/mp/process_payment')
        .send(paymentData)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBe('payment-id-123');
          expect(res.body.status).toBe('approved');
          expect(res.body.transaction_amount).toBe(150.75);
        });

      expect(
        mockPaymentAccountService.findByUserIdAndProvider,
      ).toHaveBeenCalledWith('test-owner-123', 'mercadopago');
      expect(mockPaymentCreate).toHaveBeenCalledWith({
        body: {
          transaction_amount: 150.75,
          token: 'card-token-123',
          description: 'Payment processed via Payment Brick',
          installments: 1,
          payment_method_id: 'visa',
          issuer_id: 303,
          payer: {
            email: 'test@example.com',
            identification: {
              type: 'DNI',
              number: '12345678',
            },
          },
        },
      });
    });

    it('should return 400 when owner has no payment account', async () => {
      mockPaymentAccountService.findByUserIdAndProvider.mockResolvedValue(null);

      const paymentData = {
        ownerId: 'no-account-owner',
        formData: {
          transaction_amount: 100,
          token: 'card-token-123',
          installments: 1,
          payment_method_id: 'visa',
          issuer_id: '303',
          payer: {
            email: 'test@example.com',
            identification: {
              type: 'DNI',
              number: '12345678',
            },
          },
        },
      };

      await request(app.getHttpServer())
        .post('/mp/process_payment')
        .send(paymentData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when MercadoPago payment fails', async () => {
      const paymentData = {
        ownerId: 'test-owner-error',
        formData: {
          transaction_amount: 100,
          token: 'invalid-token',
          installments: 1,
          payment_method_id: 'visa',
          issuer_id: '303',
          payer: {
            email: 'test@example.com',
            identification: {
              type: 'DNI',
              number: '12345678',
            },
          },
        },
      };

      mockPaymentCreate.mockRejectedValueOnce(
        new Error('Payment processing failed'),
      );

      await request(app.getHttpServer())
        .post('/mp/process_payment')
        .send(paymentData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle different payment methods and installments', async () => {
      const paymentData = {
        ownerId: 'test-owner-installments',
        formData: {
          transaction_amount: 600,
          token: 'mastercard-token',
          installments: 6,
          payment_method_id: 'master',
          issuer_id: '288',
          payer: {
            email: 'installments@example.com',
            identification: {
              type: 'CPF',
              number: '11122233344',
            },
          },
        },
      };

      const mockResponse = {
        id: 'installment-payment-123',
        status: 'approved',
        installments: 6,
      };

      mockPaymentCreate.mockResolvedValueOnce(mockResponse);

      await request(app.getHttpServer())
        .post('/mp/process_payment')
        .send(paymentData)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBe('installment-payment-123');
          expect(res.body.installments).toBe(6);
        });

      expect(mockPaymentCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          installments: 6,
          payment_method_id: 'master',
          issuer_id: 288,
        }),
      });
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
