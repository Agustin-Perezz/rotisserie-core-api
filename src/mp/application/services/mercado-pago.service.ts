import { CreatePreferenceDto } from '@mp/application/dto/create-preference.dto';
import { ProcessPaymentDto } from '@mp/application/dto/process-payment.dto';
import { OrderToMpItemsMapper } from '@mp/application/mappers/order-to-mp-items.mapper';
import { MercadoPagoTokenResponse } from '@mp/domain/interfaces/mercado-pago.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

import { OrderService } from '@/order/application/services/order.service';
import { OrderGateway } from '@/order/infrastructure/gateways/order.gateway';
import { PaymentAccountService } from '@/payment-account/application/services/payment-account.service';

import { PkceUtils } from './pkce.utils';

@Injectable()
export class MercadoPagoService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly paymentAccountService: PaymentAccountService,
    private readonly orderService: OrderService,
    private readonly orderGateway: OrderGateway,
  ) {}

  async createPreference(
    payload: CreatePreferenceDto,
    sellerId: string,
  ): Promise<{ preferenceId: string }> {
    try {
      const accessToken = await this.getSellerAccessToken(sellerId);
      const mpClient = this.createMercadoPagoClient(accessToken);
      const preferenceClient = new Preference(mpClient);

      const order = await this.orderService.findById(payload.orderId);
      const items = OrderToMpItemsMapper.mapOrderItemsToMpItems(order);

      const response = await preferenceClient.create({
        body: {
          purpose: payload.purpose,
          items,
          back_urls: payload.back_urls,
          external_reference: payload.external_reference || order.id,
          metadata: {
            ...payload.metadata,
            orderId: order.id,
            shopId: order.shopId,
          },
          binary_mode: true,
        },
      });

      return { preferenceId: response?.id || '' };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to create Mercado Pago preference');
    }
  }

  async processPayment(payload: ProcessPaymentDto, sellerId: string) {
    try {
      const accessToken = await this.getSellerAccessToken(sellerId);
      const mpClient = this.createMercadoPagoClient(accessToken);

      const paymentClient = new Payment(mpClient);
      const { formData } = payload;

      const response = await paymentClient.create({
        body: {
          transaction_amount: formData.transaction_amount,
          token: formData.token,
          description: 'Payment processed via Payment Brick',
          installments: formData.installments,
          payment_method_id: formData.payment_method_id,
          issuer_id: parseInt(formData.issuer_id, 10),
          payer: {
            email: formData.payer.email,
            identification: {
              type: formData.payer.identification.type,
              number: formData.payer.identification.number,
            },
          },
        },
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to process payment');
    }
  }

  generateLoginUrl(sellerId?: string): { url: string; codeVerifier: string } {
    const authApi = this.configService.get('mercadoPago.authApi') || '';
    const clientId = this.configService.get('mercadoPago.clientId') || '';
    const redirectUri = this.configService.get('mercadoPago.redirectUri') || '';

    const state = sellerId || 'default';
    const codeVerifier = PkceUtils.generateCodeVerifier();
    const codeChallenge = PkceUtils.generateCodeChallenge(codeVerifier);

    const url = `${authApi}/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    return { url, codeVerifier };
  }

  async exchangeCodeForToken(
    code: string,
    userId: string,
    codeVerifier: string,
  ) {
    const mpApi = this.configService.get('mercadoPago.mpApi') || '';
    const clientSecret = this.configService.get('mercadoPago.clientSecret');
    const clientId = this.configService.get('mercadoPago.clientId');
    const redirectUri = this.configService.get('mercadoPago.redirectUri');

    if (!mpApi || !clientSecret || !clientId || !redirectUri) {
      throw new BadRequestException(
        'Missing required Mercado Pago configuration',
      );
    }

    const formData = new URLSearchParams({
      client_secret: clientSecret,
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      //test_token: 'true',
    });

    try {
      const response = await fetch(`${mpApi}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new BadRequestException(
          `MercadoPago API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as MercadoPagoTokenResponse;

      if (!data.access_token || !data.user_id) {
        throw new BadRequestException(
          'Invalid token response from Mercado Pago',
        );
      }

      await this.paymentAccountService.upsertPaymentAccount({
        userId,
        provider: 'mercadopago',
        mpUserId: data.user_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: BigInt(data.expires_in),
        publicKey: data.public_key,
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to exchange code for token');
    }
  }

  async getSellerPublicKey(sellerId: string): Promise<string | null> {
    const seller = await this.paymentAccountService.findByUserIdAndProvider(
      sellerId,
      'mercadopago',
    );

    return seller.publicKey;
  }

  private async getSellerAccessToken(sellerId: string): Promise<string> {
    const seller = await this.paymentAccountService.findByUserIdAndProvider(
      sellerId,
      'mercadopago',
    );

    return seller.accessToken;
  }

  private createMercadoPagoClient(accessToken: string): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken,
    });
  }

  async handleWebhook(body: any, query: any) {
    try {
      const topic = query.topic || body.topic;
      const id = query.id || body.data?.id;

      if (!topic || !id) {
        return { success: false, message: 'Missing topic or id' };
      }

      if (topic === 'payment') {
        const mpApi = this.configService.get('mercadoPago.mpApi') || '';

        const paymentResponse = await fetch(`${mpApi}/v1/payments/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!paymentResponse.ok) {
          throw new BadRequestException('Failed to fetch payment details');
        }

        const paymentData = await paymentResponse.json();

        const orderId =
          paymentData.external_reference || paymentData.metadata?.orderId;

        if (!orderId) {
          return { success: false, message: 'No order reference found' };
        }

        const order = await this.orderService.findById(orderId);

        if (
          paymentData.status === 'approved' ||
          paymentData.status === 'authorized'
        ) {
          this.orderGateway.emitOrderUpdate(order.shopId, order.userId, {
            ...order,
            paymentStatus: paymentData.status,
            paymentId: paymentData.id,
          });
        }

        return { success: true, message: 'Webhook processed' };
      }

      return { success: true, message: 'Webhook received but not processed' };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to process webhook');
    }
  }
}
