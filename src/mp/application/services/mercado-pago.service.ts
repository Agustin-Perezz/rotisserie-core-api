import { CreatePreferenceDto } from '@mp/application/dto/create-preference.dto';
import { ProcessPaymentDto } from '@mp/application/dto/process-payment.dto';
import { MercadoPagoTokenResponse } from '@mp/domain/interfaces/mercado-pago.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

import { PaymentAccountService } from '@/payment-account/application/services/payment-account.service';

import { PkceUtils } from './pkce.utils';

@Injectable()
export class MercadoPagoService {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly paymentAccountService: PaymentAccountService,
  ) {}

  async createPreference(
    payload: CreatePreferenceDto,
    ownerId: string,
  ): Promise<{ preferenceId: string }> {
    try {
      const accessToken = await this.getSellerAccessToken(ownerId);
      const mpClient = this.createMercadoPagoClient(accessToken);
      const preferenceClient = new Preference(mpClient);

      const response = await preferenceClient.create({
        body: {
          purpose: payload.purpose,
          items: payload.items,
          back_urls: payload.back_urls,
          external_reference: payload.external_reference,
          metadata: payload.metadata,
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

  async processPayment(payload: ProcessPaymentDto, ownerId: string) {
    try {
      const accessToken = await this.getSellerAccessToken(ownerId);
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
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to exchange code for token');
    }
  }

  private async getSellerAccessToken(ownerId: string): Promise<string> {
    const paymentAccount =
      await this.paymentAccountService.findByUserIdAndProvider(
        ownerId,
        'mercadopago',
      );

    if (!paymentAccount || !paymentAccount.accessToken) {
      throw new BadRequestException(
        'No MercadoPago payment account found for this user',
      );
    }

    return paymentAccount.accessToken;
  }

  private createMercadoPagoClient(accessToken: string): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken,
    });
  }
}
